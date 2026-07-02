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
      <div className="min-h-screen bg-black text-white p-12 flex flex-col justify-between font-['Helvetica_Neue',Helvetica,Arial,sans-serif] antialiased selection:bg-white selection:text-black tracking-tight">
        
        {/* TOP BAR: Ultra-Minimal Header */}
        <div className="flex justify-between items-end border-b-2 border-white pb-6">
          <div>
            <p className="text-white uppercase text-xs font-black tracking-widest mb-1">ROOM CODE</p>
            <h1 className="text-6xl font-black tracking-tighter leading-none">{roomCode}</h1>
          </div>
          
          <div className="text-right">
            {gameState.gameState === "LOBBY" && (
              <button 
                onClick={() => socket.emit("startGame", roomCode)} 
                className="px-6 py-3 bg-white text-black font-black text-sm uppercase tracking-wider border-2 border-white hover:bg-black hover:text-white active:translate-y-0.5 transition-all duration-150 ease-in-out"
              >
                START MATCH
              </button>
            )}
            {gameState.gameState === "ROUND_END" && (
              <button 
                onClick={() => socket.emit("nextRound", roomCode)} 
                className="px-6 py-3 bg-white text-black font-black text-sm uppercase tracking-wider border-2 border-white hover:bg-black hover:text-white active:translate-y-0.5 transition-all duration-150 ease-in-out"
              >
                NEXT ROUND
              </button>
            )}
            {gameState.gameState === "SELECTION_PHASE" && <p className="font-black text-sm uppercase tracking-wider text-white">PLAYERS CHOOSING</p>}
            {gameState.gameState === "JUDGING_PHASE" && <p className="font-black text-sm uppercase tracking-wider text-white">CZAR JUDGING</p>}
          </div>
        </div>

        {/* MAIN DISPLAY GRID */}
        <div className="my-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-start py-8">
          
          {/* THE BLACK CARD (Pure Black, White Text, Sharp Corners) */}
          <div className="lg:col-span-1 flex justify-center lg:justify-start">
            <div className="bg-black border-4 border-white p-6 w-64 h-80 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
              <h2 className="text-2xl font-bold leading-tight text-white text-left text-balance">
                {gameState.currentBlackCard || "WAITING FOR DECK..."}
              </h2>
              <div className="text-[10px] tracking-widest text-white font-black uppercase">
                LOCAL AGAINST HUMANITY
              </div>
            </div>
          </div>

          {/* GAME STATE SUBMISSIONS AREA */}
          <div className="lg:col-span-2 flex flex-col justify-center min-h-[20rem]">
            
            {/* LOBBY STATE */}
            {gameState.gameState === "LOBBY" && (
              <div className="text-left p-8 border-4 border-white max-w-xl">
                <p className="text-white text-2xl font-black uppercase tracking-tight">WAITING FOR PLAYERS</p>
                <p className="text-white text-sm mt-2 font-mono">ENTER THE 4-LETTER CODE ABOVE ON YOUR DEVICE TO JOIN.</p>
              </div>
            )}
            
            {/* SELECTION PHASE COUNTER */}
            {gameState.gameState === "SELECTION_PHASE" && (
              <div className="text-left border-4 border-white p-8 max-w-sm">
                <div className="text-xs font-black text-white uppercase tracking-widest mb-1">CARDS SUBMITTED</div>
                <div className="text-7xl font-black text-white leading-none">
                  {gameState.submissionCount}<span className="text-neutral-700">/</span>{Math.max(1, gameState.players.length - 1)}
                </div>
              </div>
            )}

            {/* REVEALED WHITE CARDS (Pure White, Black Text, Snappy Physical Lift) */}
            {gameState.gameState === "JUDGING_PHASE" && (
              <div className="flex flex-wrap gap-6 items-center justify-center lg:justify-start">
                {gameState.submissions.map((card, i) => (
                  <div 
                    key={i} 
                    className="bg-white text-black p-5 w-52 h-72 flex flex-col justify-between border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] hover:-translate-y-2 hover:translate-x-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.3)] transition-all duration-150 ease-in-out cursor-pointer"
                  >
                    <p className="font-bold text-base leading-snug text-black text-left">{card}</p>
                    <div className="text-[10px] tracking-widest text-neutral-500 font-black uppercase font-mono text-left">
                      CHOICE {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* BRUTALIST WINNER SCREEN */}
            {winnerAnnouncement && (
              <div className="w-full max-w-xl bg-white text-black p-8 border-4 border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)]">
                <div className="text-xs font-black text-black uppercase tracking-widest mb-1">🏆 ROUND WINNER</div>
                <p className="text-4xl font-black tracking-tighter uppercase leading-none">{winnerAnnouncement.winnerName}</p>
                <div className="mt-6 pt-4 border-t-2 border-black">
                  <p className="text-lg text-black font-bold italic">"{winnerAnnouncement.cardText}"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM BAR: Flat Scoreboard Matrix */}
        <div className="border-t-2 border-white pt-6 flex flex-wrap gap-4 overflow-x-auto">
          {gameState.players.map((p, i) => (
            <div 
              key={i} 
              className={`px-5 py-3 flex items-center gap-4 transition-all ${
                p.isCzar 
                  ? "bg-white text-black border-2 border-white font-black" 
                  : "bg-black text-white border-2 border-white"
              }`}
            >
              <div className="text-left">
                <div className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                  {p.name}
                  {p.isCzar && <span className="text-[9px] bg-black text-white px-1 py-0.5 font-black tracking-widest">CZAR</span>}
                </div>
                <div className={`text-xs font-mono mt-0.5 ${p.isCzar ? "text-neutral-700" : "text-neutral-400"}`}>
                  {p.score} POINTS
                </div>
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