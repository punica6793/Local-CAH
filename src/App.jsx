import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://local-cah-backend.onrender.com", {
  transports: ["polling", "websocket"],
  autoConnect: true
});

// Strict Iconic Typography & Styling Rules
const basePageStyle = {
  backgroundColor: "#000000",
  color: "#FFFFFF",
  minHeight: "100vh",
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  padding: "40px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  boxSizing: "border-box",
  letterSpacing: "-0.03em"
};

const blackCardStyle = {
  backgroundColor: "#000000",
  color: "#FFFFFF",
  border: "4px solid #FFFFFF",
  padding: "24px",
  width: "250px",
  height: "320px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  boxSizing: "border-box",
  boxShadow: "8px 8px 0px 0px rgba(255, 255, 255, 0.2)"
};

const whiteCardStyle = {
  backgroundColor: "#FFFFFF",
  color: "#000000",
  border: "4px solid #FFFFFF",
  padding: "20px",
  width: "220px",
  height: "280px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  boxSizing: "border-box",
  boxShadow: "6px 6px 0px 0px rgba(255, 255, 255, 0.15)",
  textAlign: "left"
};

const brutalInputStyle = {
  width: "100%",
  padding: "16px",
  backgroundColor: "#000000",
  border: "4px solid #FFFFFF",
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: "900",
  outline: "none",
  boxSizing: "border-box"
};

const whiteButtonStyle = {
  width: "100%",
  padding: "16px",
  backgroundColor: "#FFFFFF",
  color: "#000000",
  border: "4px solid #FFFFFF",
  fontWeight: "900",
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  cursor: "pointer",
  boxSizing: "border-box"
};

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
    socket.on("gameStateUpdated", (updatedState) => setGameState(updatedState));
    socket.on("yourHand", (hand) => setMyHand(hand));
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

  // 1. LANDING PAGE
  if (!isJoined) {
    return (
      <div style={basePageStyle}>
        <h1 style={{ fontSize: "42px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "-0.05em", marginBottom: "40px", textAlign: "center" }}>
          LOCAL AGAINST HUMANITY
        </h1>
        
        <div style={{ width: "100%", maxWidth: "360px", border: "4px solid #FFFFFF", padding: "32px", backgroundColor: "#000000", boxSizing: "border-box" }}>
          <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "0.1em", margin: 0 }}>JOIN A GAME</h2>
            
            <div>
              <label style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>ROOM CODE</label>
              <input type="text" maxLength={4} value={roomCode} onChange={(e) => setRoomCode(e.target.value)} style={brutallInputStyle} />
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>YOUR NAME</label>
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} style={brutallInputStyle} />
            </div>

            <button type="submit" style={whiteButtonStyle}>PLAY NOW</button>
          </form>

          <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
            <div style={{ flexGrow: 1, height: "2px", backgroundColor: "#FFFFFF" }}></div>
            <span style={{ margin: "0 16px", fontSize: "12px", fontWeight: "900" }}>OR</span>
            <div style={{ flexGrow: 1, height: "2px", backgroundColor: "#FFFFFF" }}></div>
          </div>

          <button onClick={handleCreateRoom} style={{ ...whiteButtonStyle, backgroundColor: "#000000", color: "#FFFFFF" }}>
            📺 HOST LIVING ROOM TV
          </button>
        </div>
      </div>
    );
  }

  // 2. TV HOST VIEW
  if (role === "host") {
    return (
      <div style={{ ...basePageStyle, alignItems: "stretch", justifyContent: "space-between", padding: "48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "4px solid #FFFFFF", paddingBottom: "24px", width: "100%" }}>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "900", letterSpacing: "0.1em", margin: "0 0 4px 0" }}>ROOM CODE</p>
            <h1 style={{ fontSize: "72px", fontWeight: "900", margin: 0, letterSpacing: "-0.05em", lineHeight: 1 }}>{roomCode}</h1>
          </div>
          <div>
            {gameState.gameState === "LOBBY" && <button onClick={() => socket.emit("startGame", roomCode)} style={{ ...whiteButtonStyle, width: "auto", padding: "12px 24px" }}>START MATCH</button>}
            {gameState.gameState === "ROUND_END" && <button onClick={() => socket.emit("nextRound", roomCode)} style={{ ...whiteButtonStyle, width: "auto", padding: "12px 24px" }}>NEXT ROUND</button>}
          </div>
        </div>

        <div style={{ display: "flex", gap: "48px", width: "100%", margin: "auto 0", padding: "40px 0", alignItems: "flex-start" }}>
          <div style={blackCardStyle}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, lineHeight: 1.2 }}>{gameState.currentBlackCard || "WAITING FOR DECK..."}</h2>
            <div style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0.1em" }}>LOCAL AGAINST HUMANITY</div>
          </div>

          <div style={{ flexGrow: 1 }}>
            {gameState.gameState === "LOBBY" && (
              <div style={{ border: "4px solid #FFFFFF", padding: "32px", maxWidth: "500px" }}>
                <p style={{ fontSize: "24px", fontWeight: "900", margin: 0 }}>WAITING FOR PLAYERS</p>
                <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>ENTER THE CODE ABOVE ON YOUR MOBILE PHONE TO JOIN THE ROOM.</p>
              </div>
            )}

            {gameState.gameState === "SELECTION_PHASE" && (
              <div style={{ border: "4px solid #FFFFFF", padding: "32px", maxWidth: "300px" }}>
                <p style={{ fontSize: "12px", fontWeight: "900", margin: 0 }}>CARDS SUBMITTED</p>
                <p style={{ fontSize: "72px", fontWeight: "900", margin: 0, lineHeight: 1 }}>{gameState.submissionCount}/{Math.max(1, gameState.players.length - 1)}</p>
              </div>
            )}

            {gameState.gameState === "JUDGING_PHASE" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
                {gameState.submissions.map((card, i) => (
                  <div key={i} style={whiteCardStyle}>
                    <p style={{ fontSize: "16px", fontWeight: "700", margin: 0, lineHeight: 1.3 }}>{card}</p>
                    <div style={{ fontSize: "10px", fontWeight: "900", color: "#666666" }}>CHOICE {i + 1}</div>
                  </div>
                ))}
              </div>
            )}

            {winnerAnnouncement && (
              <div style={{ backgroundColor: "#FFFFFF", color: "#000000", padding: "32px", border: "4px solid #FFFFFF", maxWidth: "500px" }}>
                <p style={{ fontSize: "12px", fontWeight: "900", margin: 0 }}>🏆 ROUND WINNER</p>
                <p style={{ fontSize: "36px", fontWeight: "900", margin: "4px 0 16px 0", letterSpacing: "-0.03em" }}>{winnerAnnouncement.winnerName}</p>
                <div style={{ borderTop: "2px solid #000000", paddingTop: "12px" }}>
                  <p style={{ fontSize: "18px", fontWeight: "700", margin: 0, fontStyle: "italic" }}>"{winnerAnnouncement.cardText}"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: "4px solid #FFFFFF", paddingTop: "24px", display: "flex", gap: "16px", width: "100%", overflowX: "auto" }}>
          {gameState.players.map((p, i) => (
            <div key={i} style={{ padding: "12px 20px", border: "4px solid #FFFFFF", backgroundColor: p.isCzar ? "#FFFFFF" : "#000000", color: p.isCzar ? "#000000" : "#FFFFFF" }}>
              <p style={{ fontSize: "14px", fontWeight: "900", margin: 0 }}>{p.name} {p.isCzar && "[CZAR]"}</p>
              <p style={{ fontSize: "12px", margin: "4px 0 0 0", opacity: 0.7 }}>{p.score} POINTS</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. PLAYER MOBILE VIEW
  const amICzar = gameState.players.find(p => p.name === playerName)?.isCzar;

  return (
    <div style={{ ...basePageStyle, justifyContent: "space-between", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderBottom: "4px solid #FFFFFF", paddingBottom: "16px" }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: "900", display: "block" }}>PLAYER</span>
          <span style={{ fontSize: "20px", fontWeight: "900" }}>{playerName}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "10px", fontWeight: "900", display: "block" }}>ROLE</span>
          <span style={{ fontSize: "12px", fontWeight: "900", backgroundColor: "#FFFFFF", color: "#000000", padding: "4px 8px", textTransform: "uppercase" }}>
            {amICzar ? "👑 CZAR" : "✏️ PLAYING"}
          </span>
        </div>
      </div>

      <div style={{ margin: "auto 0", width: "100%", display: "flex", justifyContent: "center" }}>
        {gameState.gameState === "SELECTION_PHASE" && amICzar && (
          <div style={{ border: "4px solid #FFFFFF", padding: "24px", maxWidth: "320px" }}>
            <p style={{ fontSize: "20px", fontWeight: "900", margin: 0 }}>YOU ARE THE CZAR</p>
            <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>Look at the TV screen. Wait for players to submit their cards.</p>
          </div>
        )}

        {gameState.gameState === "SELECTION_PHASE" && !amICzar && (
          <div style={blackCardStyle}>
            <p style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>{gameState.currentBlackCard}</p>
            <span style={{ fontSize: "9px", fontWeight: "900" }}>CHOOSE A WHITE CARD BELOW</span>
          </div>
        )}

        {gameState.gameState === "JUDGING_PHASE" && amICzar && (
          <div style={{ width: "100%", maxWidth: "320px" }}>
            <p style={{ fontSize: "12px", fontWeight: "900", marginBottom: "16px" }}>PICK THE WINNER</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {gameState.submissions.map((cardText, i) => (
                <button key={i} onClick={() => socket.emit("selectWinner", { roomCode, winnerCardText: cardText })} style={whiteButtonStyle}>
                  {cardText}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState.gameState === "JUDGING_PHASE" && !amICzar && (
          <div style={{ border: "4px solid #FFFFFF", padding: "24px", maxWidth: "320px" }}>
            <p style={{ fontSize: "20px", fontWeight: "900", margin: 0 }}>JUDGING...</p>
            <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>The Czar is picking the funniest card. Look at the TV monitor!</p>
          </div>
        )}
      </div>

      {!amICzar && gameState.gameState === "SELECTION_PHASE" && (
        <div style={{ borderTop: "4px solid #FFFFFF", paddingTop: "20px", width: "100%" }}>
          <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }}>
            {myHand.map((card, idx) => (
              <button key={idx} onClick={() => socket.emit("submitWhiteCard", { roomCode, cardText: card })} style={whiteCardStyle}>
                <p style={{ fontSize: "14px", fontWeight: "700", margin: 0, color: "#000000" }}>{card}</p>
                <span style={{ fontSize: "9px", fontWeight: "900", color: "#999999" }}>PLAY CARD ➔</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}