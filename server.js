import { Server } from "socket.io";
import fs from "fs";

// Create the network connection server on port 3000
const io = new Server(3000, {
  cors: {
    origin: "*", // Allows phones on Wi-Fi to talk to this server
  }
});

// Load the card deck JSON file safely using modern file tools
const rawDeck = fs.readFileSync("./deck.json", "utf-8");
const DECK = JSON.parse(rawDeck);

// Track active game rooms in memory
const rooms = {};

console.log("🎲 The Invisible Referee is awake and waiting on port 3000!");

io.on("connection", (socket) => {
  
  // Action: Create a new room (Living Room TV View)
  socket.on("createRoom", () => {
    let code;
    do {
      code = Math.random().toString(36).substring(2, 6).toUpperCase();
    } while (rooms[code]); // Ensure room code uniqueness

    rooms[code] = {
      gameState: "LOBBY",
      currentBlackCard: null,
      submissions: [],
      submissionCount: 0,
      players: []
    };

    socket.emit("roomCreated", code);
  });

  // Action: Join a room (Either as TV host or Mobile player)
  socket.on("joinRoom", ({ roomCode, playerName, isHost }) => {
    const room = rooms[roomCode];
    if (!room) return;

    socket.join(roomCode);
    socket.socketRoomCode = roomCode;

    if (!isHost) {
      socket.playerName = playerName;
      
      // If player already exists (reconnected), update their socket ID
      const existingPlayer = room.players.find(p => p.name === playerName);
      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
      } else {
        // Add new player structure
        room.players.push({
          name: playerName,
          score: 0,
          isCzar: false,
          socketId: socket.id
        });
      }
    }

    io.to(roomCode).emit("gameStateUpdated", room);
  });

  // Action: Start the game (Flipped by the host)
  socket.on("startGame", (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.players.length === 0) return;

    startNewRound(roomCode);
  });

  // Logic: Reset state and set up a new round
  function startNewRound(roomCode) {
    const room = rooms[roomCode];
    room.gameState = "SELECTION_PHASE";
    room.submissions = [];
    room.submissionCount = 0;

    // Elect a random or rotating Card Czar
    room.players.forEach((player, idx) => {
      player.isCzar = (idx === (room.roundNumber || 0) % room.players.length);
    });
    room.roundNumber = (room.roundNumber || 0) + 1;

    // Pick a random black card from the uploaded deck
    const randomBlack = DECK.blackCards[Math.floor(Math.random() * DECK.blackCards.length)];
    room.currentBlackCard = randomBlack.text || randomBlack;

    // First broadcast the fresh room state so everyone goes to SELECTION_PHASE
    io.to(roomCode).emit("gameStateUpdated", room);

    // Deal a set of 7 random white cards secretly to each individual phone player
    room.players.forEach((player) => {
      if (!player.isCzar) {
        const hand = [];
        for (let i = 0; i < 7; i++) {
          const card = DECK.whiteCards[Math.floor(Math.random() * DECK.whiteCards.length)];
          // Handle if whiteCards are objects or strings
          hand.push(card.text || card);
        }
        // Send directly to their active socket connection
        io.to(player.socketId).emit("yourHand", hand);
      }
    });
  }

  // Action: Player clicks a white card from their mobile screen interface
  socket.on("submitWhiteCard", ({ roomCode, cardText }) => {
    const room = rooms[roomCode];
    if (!room) return;

    // Prevent double submissions
    const alreadySubmitted = room.submissions.some(s => s.socketId === socket.id);
    if (alreadySubmitted) return;

    room.submissions.push({ cardText, socketId: socket.id, playerName: socket.playerName });
    room.submissionCount = room.submissions.length;

    const totalExpectedSubmissions = room.players.length - 1;

    if (room.submissionCount >= totalExpectedSubmissions) {
      room.gameState = "JUDGING_PHASE";
      room.submissions.sort(() => Math.random() - 0.5);
    }

    // Keep it as a plain string array so your frontend buttons work perfectly!
    const anonymizedState = {
      ...room,
      submissions: room.submissions.map(s => s.cardText)
    };

    io.to(roomCode).emit("gameStateUpdated", anonymizedState);
  });

  // Action: Czar clicks the winning card string on their phone layout
  socket.on("selectWinner", ({ roomCode, winnerCardText }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const winningSubmission = room.submissions.find(s => s.cardText === winnerCardText);
    if (winningSubmission) {
      const winnerPlayer = room.players.find(p => p.socketId === winningSubmission.socketId);
      if (winnerPlayer) {
        winnerPlayer.score += 1;
      }

      room.gameState = "ROUND_END";

      io.to(roomCode).emit("roundWinnerAnnounced", {
        winnerName: winningSubmission.playerName,
        cardText: winnerCardText
      });

      io.to(roomCode).emit("gameStateUpdated", room);
    }
  });

  // Action: Next round request clicked by Host TV
  socket.on("nextRound", (roomCode) => {
    if (rooms[roomCode]) startNewRound(roomCode);
  });

  // Clean exit handling if a phone disconnects
  socket.on("disconnect", () => {
    const roomCode = socket.socketRoomCode;
    const room = rooms[roomCode];
    if (room) {
      room.players = room.players.filter(p => p.socketId !== socket.id);
      io.to(roomCode).emit("gameStateUpdated", room);
    }
  });
});