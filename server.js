import { Server } from "socket.io";
import fs from "fs";

// Render requires process.env.PORT dynamically. Do not hardcode 3000 inside the server instance.
const PORT = process.env.PORT || 3000;
const io = new Server(PORT, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["polling", "websocket"] // Forces polling first so firewall blocks are bypassed
});

// Load the card deck JSON file safely
const rawDeck = fs.readFileSync("./deck.json", "utf-8");
const DECK = JSON.parse(rawDeck);

const rooms = {};

console.log(`🎲 Backend server listening properly on port ${PORT}`);

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
      roundNumber: 0
    };

    socket.emit("roomCreated", code);
  });

  socket.on("joinRoom", ({ roomCode, playerName, isHost }) => {
    const room = rooms[roomCode];
    if (!room) return;

    socket.join(roomCode);
    socket.roomCode = roomCode;

    if (!isHost && playerName) {
      socket.playerName = playerName;
      
      const existingPlayer = room.players.find(p => p.name === playerName);
      if (!existingPlayer) {
        room.players.push({
          name: playerName,
          score: 0,
          isCzar: false,
          socketId: socket.id
        });
      } else {
        existingPlayer.socketId = socket.id;
      }
    }

    io.to(roomCode).emit("gameStateUpdated", room);
  });

  socket.on("startGame", (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.players.length === 0) return;
    startNewRound(roomCode);
  });

  function startNewRound(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.gameState = "SELECTION_PHASE";
    room.submissions = [];
    room.submissionCount = 0;

    room.players.forEach((player, idx) => {
      player.isCzar = (idx === (room.roundNumber || 0) % room.players.length);
    });
    room.roundNumber = (room.roundNumber || 0) + 1;

    const randomBlack = DECK.blackCards[Math.floor(Math.random() * DECK.blackCards.length)];
    room.currentBlackCard = randomBlack.text || randomBlack;

    io.to(roomCode).emit("gameStateUpdated", room);

    room.players.forEach((player) => {
      if (!player.isCzar) {
        const hand = [];
        for (let i = 0; i < 7; i++) {
          const card = DECK.whiteCards[Math.floor(Math.random() * DECK.whiteCards.length)];
          hand.push(card);
        }
        io.to(player.socketId).emit("yourHand", hand);
      }
    });
  }

  socket.on("submitWhiteCard", ({ roomCode, cardText }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const currentSubmittingPlayer = room.players.find(p => p.socketId === socket.id);
    const resolvedName = socket.playerName || currentSubmittingPlayer?.name || "Player";

    // Track submission if this socket hasn't submitted yet
    const alreadySubmitted = room.submissions.some(s => s.socketId === socket.id);
    if (!alreadySubmitted) {
      room.submissions.push({ cardText, socketId: socket.id, playerName: resolvedName });
      room.submissionCount = room.submissions.length;
    }

    const totalExpectedSubmissions = room.players.length - 1;

    if (room.submissionCount >= totalExpectedSubmissions) {
      room.gameState = "JUDGING_PHASE";
      room.submissions.sort(() => Math.random() - 0.5);
    }

    // Explicitly send a clean state object to avoid nested tracking bugs
    const publicSubmissions = room.submissions.map(s => s.cardText);
    const anonymizedState = {
      ...room,
      submissions: room.gameState === "JUDGING_PHASE" ? publicSubmissions : []
    };

    io.to(roomCode).emit("gameStateUpdated", anonymizedState);
  });

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

  socket.on("nextRound", (roomCode) => {
    if (rooms[roomCode]) startNewRound(roomCode);
  });

  socket.on("disconnect", () => {
    const room = rooms[socket.roomCode];
    if (room) {
      room.players = room.players.filter(p => p.socketId !== socket.id);
      io.to(socket.roomCode).emit("gameStateUpdated", room);
    }
  });
});