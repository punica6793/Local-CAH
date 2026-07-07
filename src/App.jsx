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
  
  // Theme State: 'dark' or 'light'
  const [theme, setTheme] = useState("dark");

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

  // Dynamic Stylings based on chosen Light / Dark theme
  const isDark = theme === "dark";
  const bgMain = isDark ? "#000000" : "#F4F4F4";
  const fgMain = isDark ? "#FFFFFF" : "#000000";
  const cardBorderColor = isDark ? "#FFFFFF" : "#000000";

  const basePageStyle = {
    backgroundColor: bgMain,
    color: fgMain,
    minHeight: "100vh",
    width: "100vw",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    letterSpacing: "-0.03em",
    position: "absolute",
    top: 0,
    left: 0,
    overflowX: "hidden"
  };

  const blackCardStyle = {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    border: `4px solid ${cardBorderColor}`,
    borderRadius: "16px",
    padding: "24px",
    width: "250px",
    height: "320px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
    boxShadow: isDark ? "8px 8px 0px 0px rgba(255, 255, 255, 0.2)" : "8px 8px 0px 0px rgba(0, 0, 0, 0.2)",
    position: "relative"
  };

  const whiteCardStyle = {
    backgroundColor: "#FFFFFF",
    color: "#000000",
    border: `4px solid ${cardBorderColor}`,
    borderRadius: "16px",
    padding: "20px",
    width: "220px",
    height: "280px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
    boxShadow: isDark ? "6px 6px 0px 0px rgba(255, 255, 255, 0.15)" : "6px 6px 0px 0px rgba(0, 0, 0, 0.15)",
    textAlign: "left",
    position: "relative"
  };

  const brutalInputStyle = {
    width: "100%",
    padding: "16px",
    backgroundColor: bgMain,
    border: `4px solid ${fgMain}`,
    color: fgMain,
    fontSize: "20px",
    fontWeight: "900",
    outline: "none",
    boxSizing: "border-box"
  };

  const whiteButtonStyle = {
    width: "100%",
    padding: "16px",
    backgroundColor: fgMain,
    color: bgMain,
    border: `4px solid ${fgMain}`,
    fontWeight: "900",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    cursor: "pointer",
    boxSizing: "border-box"
  };

  // Chaotic background typography text element components to mimic game package box art
  const BoxArtTypography = () => {
    const letterColor = isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)";
    return (
      <div style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", fontSize: "280px", fontWeight: "900", color: letterColor, top: "-40px", left: "5%", transform: "rotate(-15deg)" }}>F</div>
        <div style={{ position: "absolute", fontSize: "210px", fontWeight: "900", color: letterColor, top: "120px", right: "8%", transform: "rotate(18deg)" }}>a</div>
        <div style={{ position: "absolute", fontSize: "320px", fontWeight: "900", color: letterColor, bottom: "-60px", left: "12%", transform: "rotate(35deg)" }}>m</div>
        <div style={{ position: "absolute", fontSize: "250px", fontWeight: "900", color: letterColor, top: "40%", right: "25%", transform: "rotate(-25deg)" }}>i</div>
        <div style={{ position: "absolute", fontSize: "290px", fontWeight: "900", color: letterColor, bottom: "40px", right: "4%", transform: "rotate(12deg)" }}>l</div>
        <div style={{ position: "absolute", fontSize: "340px", fontWeight: "900", color: letterColor, top: "15%", left: "40%", transform: "rotate(-8deg)" }}>y</div>
      </div>
    );
  };

  // Small clean Family Edition Card Footer Component
  const FamilyEditionLabel = ({ cardTheme }) => {
    const accentColor = cardTheme === "black" ? "#FFFFFF" : "#000000";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.8, marginTop: "auto" }}>
        <div style={{ width: "10px", height: "12px", border: `1.5px solid ${accentColor}`, borderRadius: "2px", transform: "rotate(-10deg)", backgroundColor: accentColor === "#FFFFFF" ? "#000000" : "#FFFFFF" }} />
        <span style={{ fontSize: "10px", fontWeight: "800", letterSpacing: "0px", color: accentColor }}>Family Edition</span>
      </div>
    );
  };

  // 1. LANDING PAGE
  if (!isJoined) {
    return (
      <div style={basePageStyle}>
        <BoxArtTypography />

        {/* Theme Toggle Button Top Right */}
        <button 
          onClick={() => setTheme(isDark ? "light" : "dark")} 
          style={{ position: "absolute", top: "24px", right: "24px", padding: "8px 16px", border: `3px solid ${fgMain}`, backgroundColor: bgMain, color: fgMain, fontWeight: "900", fontSize: "12px", cursor: "pointer", zIndex: 10 }}
        >
          {isDark ? "☀️ LIGHT MODE" : "🌙 DARK MODE"}
        </button>
        
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 style={{ fontSize: "42px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "-0.05em", marginBottom: "40px", textAlign: "center" }}>
            LOCAL CARDS AGAINST HUMANITY
          </h1>
          
          <div style={{ width: "100%", maxWidth: "360px", border: `4px solid ${fgMain}`, padding: "32px", backgroundColor: bgMain, boxSizing: "border-box" }}>
            <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h2 style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "0.1em", margin: 0 }}>JOIN A GAME</h2>
              
              <div>
                <label style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>ROOM CODE</label>
                <input type="text" maxLength={4} value={roomCode} onChange={(e) => setRoomCode(e.target.value)} style={brutalInputStyle} />
              </div>

              <div>
                <label style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>YOUR NAME</label>
                <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} style={brutalInputStyle} />
              </div>

              <button type="submit" style={whiteButtonStyle}>PLAY NOW</button>
            </form>

            <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
              <div style={{ flexGrow: 1, height: "2px", backgroundColor: fgMain }}></div>
              <span style={{ margin: "0 16px", fontSize: "12px", fontWeight: "900" }}>OR</span>
              <div style={{ flexGrow: 1, height: "2px", backgroundColor: fgMain }}></div>
            </div>

            <button onClick={handleCreateRoom} style={{ ...whiteButtonStyle, backgroundColor: bgMain, color: fgMain }}>
              📺 HOST
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TV HOST VIEW
  if (role === "host") {
    return (
      <div style={{ ...basePageStyle, alignItems: "stretch", justifyContent: "space-between", padding: "48px" }}>
        <BoxArtTypography />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", flexGrow: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `4px solid ${fgMain}`, paddingBottom: "24px", width: "100%" }}>
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
              <FamilyEditionLabel cardTheme="black" />
            </div>

            <div style={{ flexGrow: 1 }}>
              {gameState.gameState === "LOBBY" && (
                <div style={{ border: `4px solid ${fgMain}`, padding: "32px", maxWidth: "500px", backgroundColor: bgMain }}>
                  <p style={{ fontSize: "24px", fontWeight: "900", margin: 0 }}>WAITING FOR PLAYERS</p>
                  <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>ENTER THE CODE ABOVE ON YOUR MOBILE PHONE TO JOIN THE ROOM.</p>
                </div>
              )}

              {gameState.gameState === "SELECTION_PHASE" && (
                <div style={{ border: `4px solid ${fgMain}`, padding: "32px", maxWidth: "300px", backgroundColor: bgMain }}>
                  <p style={{ fontSize: "12px", fontWeight: "900", margin: 0 }}>CARDS SUBMITTED</p>
                  <p style={{ fontSize: "72px", fontWeight: "900", margin: 0, lineHeight: 1 }}>{gameState.submissionCount}/{Math.max(1, gameState.players.length - 1)}</p>
                </div>
              )}

              {gameState.gameState === "JUDGING_PHASE" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
                  {gameState.submissions.map((card, i) => (
                    <div key={i} style={whiteCardStyle}>
                      <p style={{ fontSize: "16px", fontWeight: "700", margin: 0, lineHeight: 1.3 }}>{card}</p>
                      <FamilyEditionLabel cardTheme="white" />
                    </div>
                  ))}
                </div>
              )}

              {winnerAnnouncement && (
                <div style={{ backgroundColor: "#FFFFFF", color: "#000000", padding: "32px", border: "4px solid #000000", borderRadius: "16px", maxWidth: "500px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "900", margin: 0 }}>🏆 ROUND WINNER</p>
                  <p style={{ fontSize: "36px", fontWeight: "900", margin: "4px 0 16px 0", letterSpacing: "-0.03em" }}>{winnerAnnouncement.winnerName}</p>
                  <div style={{ borderTop: "2px solid #000000", paddingTop: "12px" }}>
                    <p style={{ fontSize: "18px", fontWeight: "700", margin: 0, fontStyle: "italic" }}>"{winnerAnnouncement.cardText}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: `4px solid ${fgMain}`, paddingTop: "24px", display: "flex", gap: "16px", width: "100%", overflowX: "auto" }}>
            {gameState.players.map((p, i) => (
              <div key={i} style={{ padding: "12px 20px", border: `4px solid ${fgMain}`, borderRadius: "12px", backgroundColor: p.isCzar ? fgMain : bgMain, color: p.isCzar ? bgMain : fgMain }}>
                <p style={{ fontSize: "14px", fontWeight: "900", margin: 0 }}>{p.name} {p.isCzar && "[CZAR]"}</p>
                <p style={{ fontSize: "12px", margin: "4px 0 0 0", opacity: 0.7 }}>{p.score} POINTS</p>
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
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderBottom: `4px solid ${fgMain}`, paddingBottom: "16px", zIndex: 1 }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: "900", display: "block" }}>PLAYER</span>
          <span style={{ fontSize: "20px", fontWeight: "900" }}>{playerName}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "10px", fontWeight: "900", display: "block" }}>ROLE</span>
          <span style={{ fontSize: "12px", fontWeight: "900", backgroundColor: fgMain, color: bgMain, padding: "4px 8px", textTransform: "uppercase" }}>
            {amICzar ? "👑 CZAR" : "✏️ PLAYING"}
          </span>
        </div>
      </div>

      <div style={{ margin: "auto 0", width: "100%", display: "flex", justifyContent: "center", zIndex: 1 }}>
        {gameState.gameState === "SELECTION_PHASE" && amICzar && (
          <div style={{ border: `4px solid ${fgMain}`, borderRadius: "16px", padding: "24px", maxWidth: "320px", backgroundColor: bgMain }}>
            <p style={{ fontSize: "20px", fontWeight: "900", margin: 0 }}>YOU ARE THE CZAR</p>
            <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>Look at the TV screen. Wait for players to submit their cards.</p>
          </div>
        )}

        {gameState.gameState === "SELECTION_PHASE" && !amICzar && (
          <div style={blackCardStyle}>
            <p style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>{gameState.currentBlackCard}</p>
            <FamilyEditionLabel cardTheme="black" />
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
          <div style={{ border: `4px solid ${fgMain}`, borderRadius: "16px", padding: "24px", maxWidth: "320px", backgroundColor: bgMain }}>
            <p style={{ fontSize: "20px", fontWeight: "900", margin: 0 }}>JUDGING...</p>
            <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>The Czar is picking the funniest card. Look at the TV monitor!</p>
          </div>
        )}
      </div>

      {!amICzar && gameState.gameState === "SELECTION_PHASE" && (
        <div style={{ borderTop: `4px solid ${fgMain}`, paddingTop: "20px", width: "100%", zIndex: 1 }}>
          <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }}>
            {myHand.map((card, idx) => (
              <button key={idx} onClick={() => socket.emit("submitWhiteCard", { roomCode, cardText: card })} style={whiteCardStyle}>
                <p style={{ fontSize: "14px", fontWeight: "700", margin: 0, color: "#000000" }}>{card}</p>
                <FamilyEditionLabel cardTheme="white" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}