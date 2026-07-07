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

  // Locked aesthetic variables: High-contrast rich design style
  const bgMain = "#0F0F11";
  const fgMain = "#FFFFFF";
  const cardBorderColor = "#FFFFFF";

  // Dense, highly opaque, chaotic typography layout mimicking box art
  const DenseBoxArtBackground = () => {
    const letters = [
      { char: "F", size: "140px", top: "-10px", left: "2%", rot: "-15deg" },
      { char: "a", size: "110px", top: "15px", left: "12%", rot: "25deg" },
      { char: "m", size: "150px", top: "-30px", left: "22%", rot: "-5deg" },
      { char: "i", size: "120px", top: "20px", left: "35%", rot: "18deg" },
      { char: "l", size: "130px", top: "-15px", left: "45%", rot: "-20deg" },
      { char: "y", size: "160px", top: "10px", left: "55%", rot: "30deg" },
      { char: "E", size: "140px", top: "-25px", left: "68%", rot: "-12deg" },
      { char: "d", size: "110px", top: "25px", left: "78%", rot: "15deg" },
      { char: "i", size: "120px", top: "-5px", left: "86%", rot: "-8deg" },
      { char: "t", size: "135px", top: "15px", left: "93%", rot: "22deg" },
      { char: "C", size: "160px", top: "40px", left: "5%", rot: "35deg" },
      { char: "A", size: "130px", top: "50px", left: "28%", rot: "-25deg" },
      { char: "H", size: "170px", top: "35px", left: "72%", rot: "12deg" },
    ];

    return (
      <div style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {letters.map((l, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              fontSize: l.size,
              fontWeight: "900",
              color: "rgba(255, 255, 255, 0.18)", // Noticeably more visible & opaque
              top: l.top,
              left: l.left,
              transform: `rotate(${l.rot})`,
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
            }}
          >
            {l.char}
          </div>
        ))}
      </div>
    );
  };

  const FamilyEditionLabel = ({ cardTheme }) => {
    const stampColor = cardTheme === "black" ? "#FFFFFF" : "#000000";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.9, marginTop: "auto" }}>
        <div style={{ width: "10px", height: "12px", border: `1.5px solid ${stampColor}`, borderRadius: "2px", transform: "rotate(-10deg)", backgroundColor: stampColor === "#FFFFFF" ? "#000000" : "#FFFFFF" }} />
        <span style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0px", color: stampColor }}>Family Edition</span>
      </div>
    );
  };

  const basePageStyle = { backgroundColor: bgMain, color: fgMain, minHeight: "100vh", width: "100vw", fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", boxSizing: "border-box", position: "absolute", top: 0, left: 0, overflowX: "hidden" };
  const blackCardStyle = { backgroundColor: "#000000", color: "#FFFFFF", border: `4px solid ${cardBorderColor}`, borderRadius: "16px", padding: "24px", width: "250px", height: "320px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", boxShadow: "8px 8px 0px 0px rgba(255, 255, 255, 0.15)", position: "relative" };
  const whiteCardStyle = { backgroundColor: "#FFFFFF", color: "#000000", border: `4px solid ${cardBorderColor}`, borderRadius: "16px", padding: "20px", width: "220px", height: "280px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", boxShadow: "6px 6px 0px 0px rgba(255, 255, 255, 0.1)", textAlign: "left", position: "relative" };
  const brutalInputStyle = { width: "100%", padding: "16px", backgroundColor: "#000000", border: `4px solid ${fgMain}`, color: fgMain, fontSize: "20px", fontWeight: "900", outline: "none", boxSizing: "border-box" };
  const whiteButtonStyle = { width: "100%", padding: "16px", backgroundColor: fgMain, color: bgMain, border: `4px solid ${fgMain}`, fontWeight: "900", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", boxSizing: "border-box" };

  // 1. LANDING PAGE
  if (!isJoined) {
    return (
      <div style={basePageStyle}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 style={{ fontSize: "42px", fontWeight: "900", textTransform: "uppercase", marginBottom: "40px", textAlign: "center", letterSpacing: "-0.04em" }}>LOCAL CARDS AGAINST HUMANITY</h1>
          <div style={{ width: "100%", maxWidth: "360px", border: `4px solid ${fgMain}`, padding: "32px", backgroundColor: "#000000" }}>
            <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <label style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0.1em" }}>ROOM CODE</label>
              <input type="text" maxLength={4} value={roomCode} onChange={(e) => setRoomCode(e.target.value)} style={brutalInputStyle} />
              <label style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0.1em" }}>YOUR NAME</label>
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} style={brutalInputStyle} />
              <button type="submit" style={whiteButtonStyle}>PLAY NOW</button>
            </form>
            <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}><div style={{ flexGrow: 1, height: "2px", backgroundColor: fgMain }}></div><span style={{ margin: "0 16px", fontSize: "12px", fontWeight: "900" }}>OR</span><div style={{ flexGrow: 1, height: "2px", backgroundColor: fgMain }}></div></div>
            <button onClick={handleCreateRoom} style={{ ...whiteButtonStyle, backgroundColor: "#000000", color: fgMain }}>HOST</button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TV HOST VIEW
  if (role === "host") {
    return (
      <div style={{ ...basePageStyle, alignItems: "stretch", justifyContent: "space-between", padding: "48px" }}>
        
        {/* Header Container Zone with dense scatter letters background */}
        <div style={{ position: "relative", border: `4px solid ${fgMain}`, borderRadius: "16px", padding: "24px", width: "100%", height: "140px", boxSizing: "border-box", overflow: "hidden", backgroundColor: "#000000" }}>
           <DenseBoxArtBackground />
           <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", height: "100%" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "900", margin: "0 0 2px 0", letterSpacing: "0.1em", opacity: 0.8 }}>ROOM CODE</p>
              <h1 style={{ fontSize: "64px", fontWeight: "900", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>{roomCode}</h1>
            </div>
            <div>
              {gameState.gameState === "LOBBY" && <button onClick={() => socket.emit("startGame", roomCode)} style={{ ...whiteButtonStyle, width: "auto", padding: "12px 24px" }}>START MATCH</button>}
              {gameState.gameState === "ROUND_END" && <button onClick={() => socket.emit("nextRound", roomCode)} style={{ ...whiteButtonStyle, width: "auto", padding: "12px 24px" }}>NEXT ROUND</button>}
            </div>
          </div>
        </div>

        {/* Game Area - 100% Clean background */}
        <div style={{ display: "flex", gap: "48px", width: "100%", margin: "auto 0", padding: "30px 0", alignItems: "flex-start", zIndex: 2 }}>
          <div style={blackCardStyle}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, lineHeight: 1.3 }}>{gameState.currentBlackCard || "WAITING FOR DECK..."}</h2>
            <FamilyEditionLabel cardTheme="black" />
          </div>
          <div style={{ flexGrow: 1 }}>
            {gameState.gameState === "LOBBY" && (
              <div style={{ border: `4px solid ${fgMain}`, padding: "32px", maxWidth: "500px", borderRadius: "16px", backgroundColor: "#000000" }}>
                <p style={{ fontSize: "24px", fontWeight: "900", margin: 0 }}>WAITING FOR PLAYERS</p>
                <p style={{ fontSize: "14px", margin: "8px 0 0 0", opacity: 0.8 }}>ENTER THE CODE ABOVE ON YOUR MOBILE PHONE TO JOIN.</p>
              </div>
            )}
            {gameState.gameState === "SELECTION_PHASE" && (
              <div style={{ border: `4px solid ${fgMain}`, padding: "32px", maxWidth: "300px", borderRadius: "16px", backgroundColor: "#000000" }}>
                <p style={{ fontSize: "12px", fontWeight: "900", margin: 0, letterSpacing: "0.1em" }}>CARDS SUBMITTED</p>
                <p style={{ fontSize: "72px", fontWeight: "900", margin: 0, lineHeight: 1 }}>{gameState.submissionCount}/{Math.max(1, gameState.players.length - 1)}</p>
              </div>
            )}
            {gameState.gameState === "JUDGING_PHASE" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
                {gameState.submissions.map((c, i) => (
                  <div key={i} style={whiteCardStyle}>
                    <p style={{ fontSize: "16px", fontWeight: "700", margin: 0, lineHeight: 1.3 }}>{c}</p>
                    <FamilyEditionLabel cardTheme="white" />
                  </div>
                ))}
              </div>
            )}
            {winnerAnnouncement && (
              <div style={{ backgroundColor: "#FFFFFF", color: "#000000", padding: "32px", border: `4px solid ${fgMain}`, borderRadius: "16px", maxWidth: "500px" }}>
                <p style={{ fontSize: "12px", fontWeight: "900", margin: 0 }}>🏆 ROUND WINNER</p>
                <p style={{ fontSize: "36px", fontWeight: "900", margin: "4px 0 16px 0" }}>{winnerAnnouncement.winnerName}</p>
                <div style={{ borderTop: "2px solid #000000", paddingTop: "12px" }}>
                  <p style={{ fontSize: "18px", fontWeight: "700", margin: 0, fontStyle: "italic" }}>"{winnerAnnouncement.cardText}"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Container Zone with dense scatter letters background */}
        <div style={{ position: "relative", border: `4px solid ${fgMain}`, borderRadius: "16px", padding: "24px", width: "100%", height: "130px", boxSizing: "border-box", overflow: "hidden", backgroundColor: "#000000" }}>
           <DenseBoxArtBackground />
           <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "16px", alignItems: "center", height: "100%", overflowX: "auto" }}>
            {gameState.players.map((p, i) => (
              <div key={i} style={{ padding: "12px 20px", border: `4px solid ${fgMain}`, borderRadius: "12px", backgroundColor: p.isCzar ? fgMain : "#000000", color: p.isCzar ? bgMain : fgMain, minWidth: "140px" }}>
                <p style={{ fontWeight: "900", margin: 0, fontSize: "15px" }}>{p.name} {p.isCzar && "👑"}</p>
                <p style={{ fontSize: "12px", margin: "2px 0 0 0", opacity: 0.7 }}>{p.score} POINTS</p>
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
        <p style={{ fontSize: "20px", fontWeight: "900", margin: 0 }}>{playerName}</p>
        <span style={{ backgroundColor: fgMain, color: bgMain, padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "900" }}>{amICzar ? "CZAR" : "PLAYER"}</span>
      </div>
      
      <div style={{ margin: "auto 0" }}>
        {gameState.gameState === "SELECTION_PHASE" && !amICzar && <div style={blackCardStyle}><p style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>{gameState.currentBlackCard}</p><FamilyEditionLabel cardTheme="black" /></div>}
        {gameState.gameState === "JUDGING_PHASE" && amICzar && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "320px" }}>
            <p style={{ fontSize: "12px", fontWeight: "900", textAlign: "center", marginBottom: "8px" }}>CHOOSE THE WINNER:</p>
            {gameState.submissions.map((c, i) => <button key={i} onClick={() => socket.emit("selectWinner", { roomCode, winnerCardText: c })} style={whiteButtonStyle}>{c}</button>)}
          </div>
        )}
      </div>

      {!amICzar && gameState.gameState === "SELECTION_PHASE" && (
        <div style={{ borderTop: `4px solid ${fgMain}`, paddingTop: "20px", width: "100%", overflowX: "auto", display: "flex", gap: "16px" }}>
          {myHand.map((c, idx) => <button key={idx} onClick={() => socket.emit("submitWhiteCard", { roomCode, cardText: c })} style={whiteCardStyle}><p style={{ color: "#000000", margin: 0, fontWeight: "700" }}>{c}</p><FamilyEditionLabel cardTheme="white" /></button>)}
        </div>
      )}
    </div>
  );
}