// App.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

// Connect to your deployed Node.js backend server with explicit cross-origin transport rules
const socket = io("https://local-cah-backend.onrender.com", {
  transports: ["websocket", "polling"],
  withCredentials: false
});

export default function App() {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [role, setRole] = useState(""); // "host" or "player"
  
  // Game States received from WebSockets
  const [gameState, setGameState] = useState({
    gameState: "LOBBY",
    currentBlackCard: null,
    submissions: [],
    submissionCount: 0,
    players: []
  });
  const [myHand, setMyHand] = useState([]);
  const [winnerAnnouncement, setWinnerAnnouncement] = useState(null);

  useEffect(() => {
    // Sync shared game updates from server
    socket.on("gameStateUpdated", (updatedState) => {
      setGameState(updatedState);
    });

    // Capture private dealing of white cards to phone
    socket.on("yourHand", (hand) => {
      setMyHand(hand);
    });

    // Capture winner announcements
    socket.on("roundWinnerAnnounced", (data) => {
      setWinnerAnnouncement(data);
      setTimeout(() => setWinnerAnnouncement(null), 5000); // Clear alert after 5s
    });

    return () => {
      socket.off("gameStateUpdated");
      socket.off("yourHand");
      socket.off("roundWinnerAnnounced");
    };
  }, []);

  // Action: Create game as the living room TV
  const handleCreateRoom = () => {
    setRole("host");
    socket.emit("createRoom");
    socket.on("roomCreated", (code) => {
      setRoomCode(code);
      socket.emit("joinRoom", { roomCode: code, isHost: true });
      setIsJoined(true);
    });
  };

  // Action: Join game as a smartphone controller
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomCode || !playerName) return;
    setRole("player");
    
    const cleanCode = roomCode.toUpperCase();
    setRoomCode(cleanCode); // Critical structural fix: keeps reference persistent
    
    socket.emit("joinRoom", { roomCode: cleanCode, playerName, isHost: false });
    setIsJoined(true);
  };

  // --- RENDERING PHASE 1: LOGIN LOBBY MUX ---
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-black tracking-tight mb-8">🫵 LOCAL AGAINST HUMANITY</h1>
        
        <div className="bg-neutral-800 p-6 rounded-2xl shadow-xl w-full max-w-sm border border-neutral-700">
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-300 mb-2">Join on your Phone</h2>
            <input 
              type="text" placeholder="4-LETTER ROOM CODE" maxLength={4} value={roomCode} onChange={(e) => setRoomCode(e.target.value)}
              className="w-full p-3 bg-neutral-900 border border-neutral-600 rounded-lg text-center uppercase font-mono text-xl tracking-widest text-white outline-none focus:border-white"
            />
            <input 
              type="text" placeholder="YOUR NAME" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 bg-neutral-900 border border-neutral-600 rounded-lg text-center font-bold text-white outline-none focus:border-white"
            />
            <button type="submit" className="w-full py-3 bg-white text-black font-black rounded-lg hover:bg-neutral-200 transition">PLAY NOW</button>
          </form>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-neutral-700"></div>
            <span className="flex-shrink mx-4 text-neutral-500 text-sm">OR</span>
            <div className="flex-grow border-t border-neutral-700"></div>
          </div>

          <button onClick={handleCreateRoom} className="w-full py-3 bg-neutral-700 text-white font-bold rounded-lg border border-neutral-600 hover:bg-neutral-600 transition">
            📺 HOST LIVING ROOM TV
          </button>
        </div>
      </div>
    );
  }

  // Find out if this specific device is currently the Card Czar
  const amICzar = gameState.players.find(p => p.name === playerName)?.isCzar;

  // --- RENDERING PHASE 2A: THE LIVING ROOM TV VIEW (HOST) ---
  if (role === "host") {
    return (
      <div className="min-h-screen bg-black text-white p-12 flex flex-col justify-between">
        {/* Top Bar */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
          <div>
            <p className="text-neutral-500 uppercase font-bold tracking-wider text-sm">Room Code</p>
            <h1 className="text-5xl font-mono font-black text-amber-400">{roomCode}</h1>
          </div>
          {gameState.gameState === "LOBBY" && (
            <button onClick={() => socket.emit("startGame", roomCode)} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xl rounded-xl transition">
              START MATCH 🚀
            </button>
          )}
          {gameState.gameState === "ROUND_END"