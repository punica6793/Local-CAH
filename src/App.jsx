// App.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

// Explicitly forcing polling and websocket transports to maintain connection stability over production SSL proxies
const socket = io("https://local-cah-backend.onrender.com", {
  transports: ["polling", "websocket"],
  autoConnect: true
});

export default function App() {
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [role, setRole] = useState(""); 
  
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
    socket.on("gameStateUpdated", (updatedState) => {
      setGameState(updatedState);
    });

    socket.on("yourHand", (hand) => {
      setMyHand(hand);
    });

    socket.on("roundWinnerAnnounced", (data) => {
      setWinnerAnnouncement(data);
      setTimeout(() => setWinnerAnnouncement(null), 5000);
    });

    return () => {
      socket.off("gameStateUpdated");
      socket.off("yourHand");
      socket.off("roundWinnerAnnounced");
    };
  }, []);

  const handleCreateRoom = () => {
    setRole("host");
    socket.emit("createRoom");
    socket.on("roomCreated", (code) => {
      setRoomCode(code);
      socket.emit("joinRoom", { roomCode: code, isHost: true });
      setIsJoined(true);
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomCode || !playerName) return;
    setRole("player");
    
    const cleanCode = roomCode.toUpperCase().trim();
    setRoomCode(cleanCode);
    
    socket.emit("joinRoom", { roomCode: cleanCode, playerName: playerName.trim(), isHost: false });
    setIsJoined(true);
  };

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

  const amICzar = gameState.players.find(p => p.name === playerName)?.isCzar;

  if (role === "host") {
    return (
      <div className="min-h-screen bg-black text-white p-12 flex flex-col justify-between">
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
          {gameState.gameState === "ROUND_END" && (
            <button onClick={() => socket.emit("nextRound", roomCode)} className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-black text-xl rounded-xl transition">
              NEXT ROUND ➡️
            </button>
          )}
        </div>

        <div className="my-auto grid grid-cols-3 gap-8 items-center py-8">
          <div className="col-span-1 bg-neutral-900 border-2 border-neutral-800 p-8 h-96 rounded-2xl flex flex-col justify-between shadow-2xl">
            <h2 className="text-2xl font-bold leading-relaxed">
              {gameState.currentBlackCard || "Waiting for host to kick off the deck..."}
            </h2>
            <div className="text-xs tracking-wider text-neutral-500 font-mono font-bold">LOCAL AGAINST HUMANITY</div>
          </div>

          <div className="col-span-2 flex flex-wrap gap-4 items-center justify-center">
            {gameState.gameState === "LOBBY" && (
              <div className="text-center text-neutral-400 text-2xl animate-pulse">Waiting for friends to join using code {roomCode}...</div>
            )}
            
            {gameState.gameState === "SELECTION_PHASE" && (
              <div className="text-center text-neutral-400 text-3xl">
                Cards Submitted: <span className="text-white font-black">{gameState.submissionCount}</span> / {gameState.players.length - 1}
              </div>
            )}

            {gameState.gameState === "JUDGING_PHASE" && gameState.submissions.map((card, i) => (
              <div key={i} className="bg-white text-black p-6 w-56 h-72 rounded-xl flex flex-col justify-between shadow-lg font-bold text-lg">
                <p>{card}</p>
                <span className="text-xs tracking-wider text-neutral-400 font-mono">CHOICE {i + 1}</span>
              </div>
            ))}

            {winnerAnnouncement && (
              <div className="bg-amber-400 text-black p-8 rounded-2xl text-center border shadow-2xl max-w-xl">
                <h3 className="text-xl font-bold uppercase tracking-wider text-amber-900">Round Winner!</h3>
                <p className="text-4xl font-black my-4">🎉 {winnerAnnouncement.winnerName}</p>
                <p className="italic text-lg border-t border-amber-500 pt-3 mt-3 font-semibold">"{winnerAnnouncement.cardText}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex gap-6 overflow-x-auto">
          {gameState.players.map((p, i) => (
            <div key={i} className={`px-6 py-3 rounded-lg border flex items-center gap-3 shrink-0 ${p.isCzar ? "border-amber-400 bg-amber-950/20" : "border-neutral-800 bg-neutral-950"}`}>
              <span className="text-xl">{p.isCzar ? "👑" : "👤"}</span>
              <div>
                <div className="font-bold">{p.name}</div>
                <div className="text-xs text-neutral-400">{p.score} Awesome Points</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between">
      <div className="bg-neutral-900 p-4 border-b border-neutral-800 flex justify-between items-center">
        <div>
          <span className="text-xs text-neutral-400 uppercase tracking-wider block">Your Name</span>
          <span className="font-black text-amber-400">{playerName}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-neutral-400 uppercase tracking-wider block">Status</span>
          <span className="font-bold text-sm bg-neutral-800 px-3 py-1 rounded-full text-white">
            {amICzar ? "👑 YOU ARE CZAR" : "✏️ SELECTION"}
          </span>
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col justify-center items-center">
        {gameState.gameState === "SELECTION_PHASE" && amICzar && (
          <div className="text-center text-neutral-400 p-6">
            <p className="text-lg">You are the Card Czar for this round!</p>
            <p className="text-sm text-neutral-500 mt-2">Relax and look up at the main TV screen while the rest of the room picks their cards.</p>
          </div>
        )}

        {gameState.gameState === "SELECTION_PHASE" && !amICzar && (
          <div className="w-full text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">Tap a card below to submit</p>
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-left max-w-sm mx-auto text-sm italic text-neutral-300">
              {gameState.currentBlackCard}
            </div>
          </div>
        )}

        {gameState.gameState === "JUDGING_PHASE" && amICzar && (
          <div className="w-full max-w-md">
            <h3 className="text-center font-bold text-amber-400 mb-4 text-lg">👇 TAP THE FUNNIEST RESPONSE</h3>
            <div className="space-y-3">
              {gameState.submissions.map((cardText, i) => (
                <button 
                  key={i} onClick={() => socket.emit("selectWinner", { roomCode, winnerCardText: cardText })}
                  className="w-full text-left p-4 bg-white text-black font-bold rounded-xl shadow-md active:scale-95 transition-transform"
                >
                  {cardText}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState.gameState === "JUDGING_PHASE" && !amICzar && (
          <p className="text-center text-neutral-500 text-lg animate-pulse">The Czar is judging the submittals. Look up at the TV screen!</p>
        )}
      </div>

      {!amICzar && gameState.gameState === "SELECTION_PHASE" && (
        <div className="p-4 bg-neutral-900 border-t border-neutral-800">
          <div className="flex gap-3 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory">
            {myHand.map((card, idx) => (
              <button
                key={idx}
                onClick={() => socket.emit("submitWhiteCard", { roomCode, cardText: card })}
                className="snap-center shrink-0 w-44 h-56 bg-white text-black font-bold p-4 rounded-xl flex flex-col justify-between text-left shadow-lg transform active:translate-y-2 transition-transform"
              >
                <p className="text-sm leading-tight">{card}</p>
                <span className="text-[10px] text-neutral-400 tracking-wider uppercase font-mono font-bold">Tap to play</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}