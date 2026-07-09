import { Server } from "socket.io";
import fs from "fs";

// Render requires process.env.PORT dynamically.
const PORT = process.env.PORT || 3000;
const io = new Server(PORT, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["polling", "websocket"]
});

// Load the card deck JSON file safely
const rawDeck = fs.readFileSync("./deck.json", "utf-8");
const DECK = JSON.parse(rawDeck);

const rooms = {};
const SCORE_CAP = 5; // The threshold required to win the entire game match

console.log(`🎲 Backend engine spinning smoothly on port ${PORT}`);

// Helper function to safely broadcast data without breaking your React structural expectations
function broadcastSanitizedState(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  // Enforce clean string-only arrays during judging/revelation phases to prevent object parsing crashes on mobile UI
  let cleanSubmissions = [];
  if (room.gameState === "JUDGING_PHASE" || room.gameState === "ROUND_END") {
    cleanSubmissions = room.submissions.map(s => s.cardText);
  }

  const sanitizedState = {
    gameState: room.gameState,
    currentBlackCard: room.currentBlackCard,
    submissions: cleanSubmissions,
    submissionCount: room.submissionCount,
    players: room.players.map(p => ({
      name: p.name,
      score: p.score,
      isCzar: p.isCzar,
      connected: p.connected !== false // Let client know connection health status safely
    })),
    roundNumber: room.roundNumber
  };

  io.to(roomCode).emit("gameStateUpdated", sanitizedState);
}

// Automatically submits for players who run out of time
function autoSubmitRemaining(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.gameState !== "SELECTION_PHASE") return;

  room.players.forEach((player) => {
    if (player.isCzar) return;

    // Check if player already submitted
    const hasSubmitted = room.submissions.some(s => s.playerName === player.name);
    if (!hasSubmitted && player.hand && player.hand.length > 0) {
      // Pick a random card from their current server-side tracking hand
      const randomIdx = Math.floor(Math.random() * player.hand.length);
      const chosenCard = player.hand[randomIdx];

      // Remove from hand array
      player.hand.splice(randomIdx, 1);

      // Submit card text internally
      room.submissions.push({ cardText: chosenCard, socketId: player.socketId, playerName: player.name });
    }
  });

  room.submissionCount = room.submissions.length;
  
  // Advance to judging phase automatically
  room.gameState = "JUDGING_PHASE";
  room.submissions.sort(() => Math.random() - 0.5);
  
  broadcastSanitizedState(roomCode);
}

function startNewRound(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  // Clear any existing active room timers before spinning up a new sequence
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
  }

  room.gameState = "SELECTION_PHASE";
  room.submissions = [];
  room.submissionCount = 0;

  // Rotate CZAR status cleanly
  room.players.forEach((player, idx) => {
    player.isCzar = (idx === (room.roundNumber || 0) % room.players.length);
  });
  room.roundNumber = (room.roundNumber || 0) + 1;

  // Draw Unique Black Card from room sub-deck tracking pool
  if (room.deck.black.length === 0) {
    room.deck.black = [...DECK.blackCards].sort(() => Math.random() - 0.5);
  }
  const pulledBlackCard = room.deck.black.pop();
  room.currentBlackCard = pulledBlackCard.text || pulledBlackCard;

  // Top off player hands back to exactly 7 items from the isolated sub-deck
  room.players.forEach((player) => {
    if (!player.hand) player.hand = [];

    if (!player.isCzar) {
      while (player.hand.length < 7) {
        if (room.deck.white.length === 0) {
          room.deck.white = [...DECK.whiteCards].sort(() => Math.random() - 0.5);
        }
        player.hand.push(room.deck.white.pop());
      }
      // Force pass private up-to-date deck directly down to specific socket context safely
      io.to(player.socketId).emit("yourHand", player.hand);
    }
  });

  broadcastSanitizedState(roomCode);

  // Set up selection phase countdown clock (60 seconds)
  room.timeLeft = 60;
  room.timerInterval = setInterval(() => {
    room.timeLeft--;
    if (room.timeLeft <= 0) {
      clearInterval(room.timerInterval);
      autoSubmitRemaining(roomCode);
    }
  }, 1000);
}

io.on("connection", (socket) => {

  socket.on("createRoom", () => {
    let code;
    do {
      code = Math.random().toString(36).substring(2, 6).toUpperCase();
    } while (rooms[code]);

    rooms[code] = {
      gameState: "LOBBY",
      currentBlackCard: null,
      submissions: [],
      submissionCount: 0,
      players: [],
      roundNumber: 0,
      timerInterval: null,
      timeLeft: 0,
      // Internal room sub-decks to ensure card instance text uniqueness
      deck: {
        black: [...DECK.blackCards].sort(() => Math.random() - 0.5),
        white: [...DECK.whiteCards].sort(() => Math.random() - 0.5)
      }
    };

    socket.emit("roomCreated", code);
  });

  socket.on("joinRoom", ({ roomCode, playerName, isHost }) => {
    const cleanCode = roomCode ? roomCode.toUpperCase().trim() : "";
    const room = rooms[cleanCode];
    if (!room) return;

    socket.join(cleanCode);
    socket.roomCode = cleanCode;

    if (!isHost && playerName) {
      const cleanName = playerName.trim();
      socket.playerName = cleanName;
      
      const existingPlayer = room.players.find(p => p.name === cleanName);
      if (!existingPlayer) {
        // Fresh brand new player insertion configuration
        room.players.push({
          name: cleanName,
          score: 0,
          isCzar: false,
          socketId: socket.id,
          connected: true,
          hand: []
        });
      } else {
        // Reconnection logic path executed: clear countdown cleanups safely
        existingPlayer.socketId = socket.id;
        existingPlayer.connected = true;
        if (existingPlayer.disconnectTimeout) {
          clearTimeout(existingPlayer.disconnectTimeout);
          existingPlayer.disconnectTimeout = null;
        }
        // Send player back their current state hand immediately
        socket.emit("yourHand", existingPlayer.hand || []);
      }
    }

    broadcastSanitizedState(cleanCode);
  });

  socket.on("startGame", (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.players.length === 0) return;
    startNewRound(roomCode);
  });

  socket.on("submitWhiteCard", ({ roomCode, cardText }) => {
    const room = rooms[roomCode];
    if (!room || room.gameState !== "SELECTION_PHASE") return;

    const resolvedName = socket.playerName || room.players.find(p => p.socketId === socket.id)?.name;
    if (!resolvedName) return;

    const alreadySubmitted = room.submissions.some(s => s.playerName === resolvedName);
    if (alreadySubmitted) return;

    // Remove the submitted card text item directly out from player's tracking deck array
    const playerObj = room.players.find(p => p.name === resolvedName);
    if (playerObj && playerObj.hand) {
      playerObj.hand = playerObj.hand.filter(card => card !== cardText);
    }

    room.submissions.push({ cardText, socketId: socket.id, playerName: resolvedName });
    room.submissionCount = room.submissions.length;

    const totalExpectedSubmissions = room.players.filter(p => !p.isCzar && p.connected !== false).length;

    if (room.submissionCount >= totalExpectedSubmissions) {
      if (room.timerInterval) clearInterval(room.timerInterval); // Halt countdown clock early
      room.gameState = "JUDGING_PHASE";
      room.submissions.sort(() => Math.random() - 0.5); // Randomize layout order
    }

    broadcastSanitizedState(roomCode);
  });

  socket.on("selectWinner", ({ roomCode, winnerCardText }) => {
    const room = rooms[roomCode];
    if (!room || room.gameState !== "JUDGING_PHASE") return;

    const winningSubmission = room.submissions.find(s => s.cardText === winnerCardText);
    if (winningSubmission) {
      const winnerPlayer = room.players.find(p => p.name === winningSubmission.playerName);
      let isMatchOver = false;

      if (winnerPlayer) {
        winnerPlayer.score += 1;
        if (winnerPlayer.score >= SCORE_CAP) {
          isMatchOver = true;
        }
      }

      room.gameState = "ROUND_END";

      // If a player crosses the core cap limit, transform the winner layout card to flag the crown achievement
      const broadcastName = isMatchOver 
        ? `👑 ${winningSubmission.playerName} WINS THE ENTIRE GAME! 👑`
        : winningSubmission.playerName;

      io.to(roomCode).emit("roundWinnerAnnounced", {
        winnerName: broadcastName,
        cardText: winnerCardText
      });

      // If the match is concluded, zero-out scores behind the scenes for the next match loop setup
      if (isMatchOver) {
        room.players.forEach(p => p.score = 0);
        room.roundNumber = 0;
      }

      broadcastSanitizedState(roomCode);
    }
  });

  socket.on("nextRound", (roomCode) => {
    if (rooms[roomCode]) startNewRound(roomCode);
  });

  socket.on("disconnect", () => {
    const roomCode = socket.roomCode;
    const playerName = socket.playerName;
    const room = rooms[roomCode];

    if (room && playerName) {
      const player = room.players.find(p => p.name === playerName);
      if (player) {
        player.connected = false;

        // Give mobile phones a 25-second grace countdown interval window to restore connections
        player.disconnectTimeout = setTimeout(() => {
          if (!player.connected) {
            // Completely drop and purge dead data context profiles from room space
            room.players = room.players.filter(p => p.name !== playerName);
            
            // Clean up room memory spaces cleanly if last user closes connection pipeline
            if (room.players.length === 0) {
              if (room.timerInterval) clearInterval(room.timerInterval);
              delete rooms[roomCode];
              return;
            }

            // Emergency bypass handler if active Czar client context drops out mid-round
            if (player.isCzar && room.gameState !== "LOBBY") {
              startNewRound(roomCode);
            } else {
              broadcastSanitizedState(roomCode);
            }
          }
        }, 25000);
      }
    }
  });
});