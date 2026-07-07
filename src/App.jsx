import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

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

  // Locked high-contrast theme variables
  const bgMain = "#000000";
  const fgMain = "#FFFFFF";
  const cardBorderColor = "#FFFFFF";

  // Clean, global randomized letter scatter
  const BackgroundDesign = () => {
    const letterColor = "rgba(255, 255, 255, 0.05)";
    return (
      <div style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", fontSize: "140px", fontWeight: "900", color: letterColor, top: "8%", left: "5%", transform: "rotate(-12deg)" }}>H</div>
        <div style={{ position: "absolute", fontSize: "110px", fontWeight: "900", color: letterColor, top: "12%", right: "8%", transform: "rotate(15deg)" }}>X</div>
        <div style={{ position: "absolute", fontSize: "160px", fontWeight: "900", color: letterColor, top: "35%", left: "12%", transform: "rotate(-25deg)" }}>A</div>
        <div style={{ position: "absolute", fontSize: "130px", fontWeight: "900", color: letterColor, top: "40%", right: "14%", transform: "rotate(18deg)" }}>B</div>
        <div style={{ position: "absolute", fontSize: "150px", fontWeight: "900", color: letterColor, bottom: "30%", left: "7%", transform: "rotate(-15deg)" }}>C</div>
        <div style={{ position: "absolute", fontSize: "170px", fontWeight: "900", color: letterColor, bottom: "28%", right: "6%", transform: "rotate(32deg)" }}>Z</div>
        <div style={{ position: "absolute", fontSize: "125px", fontWeight: "900", color: letterColor, bottom: "8%", left: "22%", transform: "rotate(8deg)" }}>P</div>
        <div style={{ position: "absolute", fontSize: "145px", fontWeight: "900", color: letterColor, bottom: "6%", right: "25%", transform: "rotate(-18deg)" }}>Q</div>
      </div>
    );
  };

  const FamilyEditionLabel = ({ cardTheme }) => {
    const stampColor = cardTheme === "black" ? "#FFFFFF" : "#000000";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.8, marginTop: "auto" }}>
        <div style={{ width: "10px", height: "12px", border: `1.5px solid ${stampColor}`, borderRadius: "2px", transform: "rotate(-10deg)", backgroundColor: stampColor === "#FFFFFF" ? "#000000" : "#FFFFFF" }} />
        <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0px", color: stampColor }}>Family Edition</span>
      </div>
    );
  };

  const basePageStyle = { backgroundColor: bgMain, color: fgMain, minHeight: "100vh", width: "100vw", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", boxSizing: "border-box", position: "absolute", top: 0, left: 0, overflowX: "hidden" };
  const blackCardStyle = { backgroundColor: "#000000", color: "#FFFFFF", border: `4px solid ${cardBorderColor}`, borderRadius: "16px", padding: "24px", width: "250px", height: "320px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", boxShadow: "8px 8px 0px 0px rgba(255, 255, 255, 0.15)", position: "relative", zIndex: 2 };
  const whiteCardStyle = { backgroundColor: "#FFFFFF", color: "#000000", border: `4px solid ${cardBorderColor}`, borderRadius: "16px", padding: "20px", width: "220px", height: "280px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", boxShadow: "6px 6px 0px 0px rgba(255, 255, 255, 0.1)", textAlign: "left", position: "relative", zIndex: 2 };
  const brutalInputStyle = { width: "100%", padding: "16px", backgroundColor: bgMain, border: `4px solid ${fgMain}`, color: fgMain, fontSize: "20px", fontWeight: "900", outline: "none", boxSizing: "border-box" };
  const whiteButtonStyle = { width: "100%", padding: "16px", backgroundColor: fgMain, color: bgMain, border: `4px solid ${fgMain}`, fontWeight: "900", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", boxSizing: "border-box" };

  // 1. LANDING PAGE
  if (!isJoined) {
    return (
      <div style={basePageStyle}>
        <BackgroundDesign />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 style={{ fontSize: "42px", fontWeight: "900", textTransform: "uppercase", marginBottom: "40px", textAlign: "center" }}>LOCAL CARDS AGAINST HUMANITY</h1>
          <div style={{ width: "100%", maxWidth: "360px", border: `4px solid ${fgMain}`, padding: "32px", backgroundColor: bgMain }}>
            <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <label style={{ fontSize: "10px", fontWeight: "900" }}>ROOM CODE</label>
              <input type="text" maxLength={4} value={roomCode} onChange={(e) => setRoomCode(e.target.value)} style={brutalInputStyle} />
              <label style={{ fontSize: "10px", fontWeight: "900" }}>YOUR NAME</label>
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} style={brutalInputStyle} />
              <button type="submit" style={whiteButtonStyle}>PLAY NOW</button>
            </form>
            <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}><div style={{ flexGrow: 1, height: "2px", backgroundColor: fgMain }}></div><span style={{ margin: "0 16px", fontSize: "12px", fontWeight: "900" }}>OR</span><div style={{ flexGrow: 1, height: "2px", backgroundColor: fgMain }}></div></div>
            <button onClick={handleCreateRoom} style={{ ...whiteButtonStyle, backgroundColor: bgMain, color: fgMain }}>HOST</button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TV HOST VIEW
  if (role === "host") {
    return (
      <div style={{ ...basePageStyle, alignItems: "stretch", justifyContent: "space-between", padding: "48px" }}>
        {/* Render Background once at the root level so it covers everything seamlessly */}
        <BackgroundDesign />

        {/* Header */}
        <div style={{ position: "relative", zIndex: 1, borderBottom: `4px solid ${fgMain}`, paddingBottom: "24px", width: "100%" }}>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ fontSize: "12px", fontWeight: "900", margin: "0 0 4px 0" }}>ROOM CODE</p>
              <h1 style={{ fontSize: "72px", fontWeight: "900", margin: 0 }}>{roomCode}</h1>
            </div>
            {gameState.gameState === "LOBBY" && <button onClick={() => socket.emit("startGame", roomCode)} style={{ ...whiteButtonStyle, width: "auto", padding: "12px 24px" }}>START MATCH</button>}
            {gameState.gameState === "ROUND_END" && <button onClick={() => socket.emit("nextRound", roomCode)} style={{ ...whiteButtonStyle, width: "auto", padding: "12px 24px" }}>NEXT ROUND</button>}
          </div>
        </div>

        {/* Game Area */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "48px", width: "100%", margin: "40px 0", alignItems: "flex-start" }}>
          <div style={blackCardStyle}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>{gameState.currentBlackCard || "WAITING..."}</h2>
            <FamilyEditionLabel cardTheme="black" />
          </div>
          <div style={{ flexGrow: 1 }}>
            {gameState.gameState === "LOBBY" && <div style={{ border: `4px solid ${fgMain}`, padding: "32px", maxWidth: "500px", backgroundColor: bgMain }}><p>WAITING FOR PLAYERS...</p></div>}
            {gameState.gameState === "SELECTION_PHASE" && <div style={{ border: `4px solid ${fgMain}`, padding: "32px", backgroundColor: bgMain }}><h1>{gameState.submissionCount}/{Math.max(1, gameState.players.length - 1)}</h1></div>}
            {gameState.gameState === "JUDGING_PHASE" && <div style={{ display: "flex", gap: "24px" }}>{gameState.submissions.map((c, i) => <div key={i} style={whiteCardStyle}><p>{c}</p><FamilyEditionLabel cardTheme="white" /></div>)}</div>}
            {winnerAnnouncement && <div style={{ backgroundColor: fgMain, color: bgMain, padding: "32px", border: `4px solid ${fgMain}`, borderRadius: "16px" }}><p>🏆 ROUND WINNER</p><h1>{winnerAnnouncement.winnerName}</h1><p>"{winnerAnnouncement.cardText}"</p></div>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 1, borderTop: `4px solid ${fgMain}`, paddingTop: "24px", width: "100%" }}>
           <div style={{ display: "flex", gap: "16px" }}>
            {gameState.players.map((p, i) => (
              <div key={i} style={{ padding: "12px 20px", border: `4px solid ${fgMain}`, borderRadius: "12px", backgroundColor: p.isCzar ? fgMain : bgMain, color: p.isCzar ? bgMain : fgMain }}>
                <p style={{ fontWeight: "900", margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: "12px", margin: 0, opacity: 0.7 }}>{p.score} PTS</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. PLAYER MOBILE VIEW
  const amICzar = gameState.players.find(p => p.name === playerName)?.isCzar;
  return (
    <div style={{ ...basePageStyle, justifyContent: "space-between", padding: "24px" }}>
       <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderBottom: `4px solid ${fgMain}`, paddingBottom: "16px" }}>
        <p style={{ fontSize: "20px", fontWeight: "900" }}>{playerName}</p>
        <span style={{ backgroundColor: fgMain, color: bgMain, padding: "4px 8px", fontSize: "12px", fontWeight: "900" }}>{amICzar ? "CZAR" : "PLAYER"}</span>
      </div>
      
      <div style={{ margin: "auto 0" }}>
        {gameState.gameState === "SELECTION_PHASE" && !amICzar && <div style={blackCardStyle}><p>{gameState.currentBlackCard}</p><FamilyEditionLabel cardTheme="black" /></div>}
        {gameState.gameState === "JUDGING_PHASE" && amICzar && <div style={{display: "flex", flexDirection: "column", gap: "10px"}}>{gameState.submissions.map((c, i) => <button key={i} onClick={() => socket.emit("selectWinner", { roomCode, winnerCardText: c })} style={whiteButtonStyle}>{c}</button>)}</div>}
      </div>

      {!amICzar && gameState.gameState === "SELECTION_PHASE" && (
        <div style={{ borderTop: `4px solid ${fgMain}`, paddingTop: "20px", width: "100%", overflowX: "auto", display: "flex", gap: "16px" }}>
          {myHand.map((c, idx) => <button key={idx} onClick={() => socket.emit("submitWhiteCard", { roomCode, cardText: c })} style={whiteCardStyle}><p>{c}</p><FamilyEditionLabel cardTheme="white" /></button>)}
        </div>
      )}
    </div>
  );
}