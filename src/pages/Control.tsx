/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { SOCKET_CONFIG } from "../config";

const socket = io(SOCKET_CONFIG.SERVER_URL, {
  transports: ["websocket"],
});

const Control: React.FC = () => {
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [team1Color, setTeam1Color] = useState("#3B82F6");
  const [team2Color, setTeam2Color] = useState("#10B981");
  const [lastScorer, setLastScorer] = useState<"team1" | "team2" | null>(null);
  const [team1Sets, setTeam1Sets] = useState(0);
  const [team2Sets, setTeam2Sets] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  let setWinnerChecked = false;
  const [team1SetsHistory, setTeam1SetsHistory] = useState<number[]>([]);
  const [team2SetsHistory, setTeam2SetsHistory] = useState<number[]>([]);
  const [showMatchFinishedPopup, setShowMatchFinishedPopup] = useState(false);
  const [matchWinner, setMatchWinner] = useState<string>("");

  const updateSetScores = (team1Score: number, team2Score: number) => {
    if (team1Score > team2Score) {
      setTeam1SetsHistory([...team1SetsHistory, team1Score]);
      setTeam2SetsHistory([...team2SetsHistory, team2Score]);
    } else if (team2Score > team1Score) {
      setTeam1SetsHistory([...team1SetsHistory, team1Score]);
      setTeam2SetsHistory([...team2SetsHistory, team2Score]);
    }
  };

  const handleScoreChange = (team: "team1" | "team2", delta: number) => {
    if (matchWinner) return;
    updateScore(team, delta);
    checkForSetWinner();
  };

  const updateScore = (team: "team1" | "team2", delta: number) => {
    if (team === "team1") {
      const newScore1 = Math.max(team1Score + delta, 0);
      socket.emit("update-score", {
        team1Name,
        team2Name,
        team1Score: newScore1,
        team2Score,
        team1Color,
        team2Color,
        team1Sets,
        team2Sets,
        currentSet,
      });
      setTeam1Score(newScore1);
    } else if (team === "team2") {
      const newScore2 = Math.max(team2Score + delta, 0);
      socket.emit("update-score", {
        team1Name,
        team2Name,
        team1Score,
        team2Score: newScore2,
        team1Color,
        team2Color,
        team1Sets,
        team2Sets,
        currentSet,
      });
      setTeam2Score(newScore2);
    }
  };

  const checkForSetWinner = () => {
    if (setWinnerChecked) return;
    setWinnerChecked = true;

    if (currentSet < 3) {
      if (team1Score == 25 && team1Score - team2Score > 1) {
        const newTeam1Sets = team1Sets + 1;
        updateSetScores(team1Score, team2Score);
        resetScoresForNextSet(newTeam1Sets, team2Sets);
      } else if (team2Score == 25 && team2Score - team1Score > 1) {
        const newTeam2Sets = team2Sets + 1;
        updateSetScores(team1Score, team2Score);
        resetScoresForNextSet(team1Sets, newTeam2Sets);
      } else if (team1Score == 24 && team2Score == 24) {
        return;
      } else if (team1Score > 24 && team1Score - team2Score > 1) {
        const newTeam1Sets = team1Sets + 1;
        updateSetScores(team1Score, team2Score);
        resetScoresForNextSet(newTeam1Sets, team2Sets);
      } else if (team2Score > 24 && team2Score - team1Score > 1) {
        const newTeam2Sets = team2Sets + 1;
        updateSetScores(team1Score, team2Score);
        resetScoresForNextSet(team1Sets, newTeam2Sets);
      }
    } else if (currentSet === 3) {
      if (team1Score == 15 && team1Score - team2Score > 1) {
        const newTeam1Sets = team1Sets + 1;
        updateSetScores(team1Score, team2Score);
        resetScoresForNextSet(newTeam1Sets, team2Sets);
      } else if (team2Score == 15 && team2Score - team1Score > 1) {
        const newTeam2Sets = team2Sets + 1;
        updateSetScores(team1Score, team2Score);
        resetScoresForNextSet(team1Sets, newTeam2Sets);
      } else if (team1Score == 14 && team2Score == 14) {
        return;
      } else if (team1Score > 14 && team1Score - team2Score > 1) {
        const newTeam1Sets = team1Sets + 1;
        updateSetScores(team1Score, team2Score);
        resetScoresForNextSet(newTeam1Sets, team2Sets);
      } else if (team2Score > 14 && team2Score - team1Score > 1) {
        const newTeam2Sets = team2Sets + 1;
        updateSetScores(team1Score, team2Score);
        resetScoresForNextSet(team1Sets, newTeam2Sets);
      }
    }

    setTimeout(() => {
      setWinnerChecked = false;
    }, 100);
  };

  const resetScoresForNextSet = (
    newTeam1Sets: number,
    newTeam2Sets: number
  ) => {
    setTeam1Score(0);
    setTeam2Score(0);

    const isMatchFinished = newTeam1Sets === 2 || newTeam2Sets === 2;

    if (!isMatchFinished) {
      setCurrentSet((prevSet) => {
        const nextSet = prevSet + 1;
        socket.emit("update-score", {
          team1Name,
          team2Name,
          team1Score: 0,
          team2Score: 0,
          team1Color,
          team2Color,
          team1Sets: newTeam1Sets,
          team2Sets: newTeam2Sets,
          currentSet: nextSet,
        });
        return nextSet;
      });
    }

    if (currentSet >= 3 || newTeam1Sets === 2 || newTeam2Sets === 2) {
      checkForMatchWinner(newTeam1Sets, newTeam2Sets);
    }
  };

  const checkForMatchWinner = (newTeam1Sets: number, newTeam2Sets: number) => {
    if (newTeam1Sets === 2) {
      setMatchWinner(team1Name);
      setShowMatchFinishedPopup(true);
    } else if (newTeam2Sets === 2) {
      setMatchWinner(team2Name);
      setShowMatchFinishedPopup(true);
    }
  };

  const resetAll = () => {
    setTeam1Score(0);
    setTeam2Score(0);
    setTeam1Sets(0);
    setTeam2Sets(0);
    setCurrentSet(1);
    setTeam1SetsHistory([]);
    setTeam2SetsHistory([]);
    setShowMatchFinishedPopup(false);
    setMatchWinner("");

    window.focus();

    socket.emit("update-score", {
      team1Name,
      team2Name,
      team1Score: 0,
      team2Score: 0,
      team1Color,
      team2Color,
      team1Sets: 0,
      team2Sets: 0,
      currentSet: 1,
    });
  };

  const resetScore = () => {
    setTeam1Score(0);
    setTeam2Score(0);
    setLastScorer(null);
    setTeam1Sets(0);
    setTeam2Sets(0);
    setCurrentSet(1);
    setTeam1SetsHistory([]);
    setTeam2SetsHistory([]);
    setMatchWinner("");
    setShowMatchFinishedPopup(false);

    socket.emit("update-score", {
      team1Name,
      team2Name,
      team1Score: 0,
      team2Score: 0,
      team1Color,
      team2Color,
      team1Sets: 0,
      team2Sets: 0,
      currentSet: 1,
    });
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "1") {
        handleScoreChange("team1", 1);
      } else if (event.key === "2") {
        handleScoreChange("team2", 1);
      } else if (event.key === "-") {
        if (event.shiftKey) {
          handleScoreChange("team1", -1);
        } else {
          handleScoreChange("team2", -1);
        }
      } else if (event.key === "0") {
        resetScore();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [team1Score, team2Score, matchWinner]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("game-state", (data) => {
      setTeam1Name(data.team1Name);
      setTeam2Name(data.team2Name);
      setTeam1Score(data.team1Score);
      setTeam2Score(data.team2Score);
      setTeam1Color(data.team1Color);
      setTeam2Color(data.team2Color);
      setTeam1Sets(data.team1Sets);
      setTeam2Sets(data.team2Sets);
      setCurrentSet(data.currentSet);
    });

    socket.on("update-score", (data) => {
      setTeam1Name(data.team1Name);
      setTeam2Name(data.team2Name);
      setTeam1Score(data.team1Score);
      setTeam2Score(data.team2Score);
      setTeam1Color(data.team1Color);
      setTeam2Color(data.team2Color);
      setTeam1Sets(data.team1Sets);
      setTeam2Sets(data.team2Sets);
      setCurrentSet(data.currentSet);
    });

    socket.on("reset-score", (data) => {
      setTeam1Score(data.team1Score);
      setTeam2Score(data.team2Score);
      setTeam1Sets(data.team1Sets);
      setTeam2Sets(data.team2Sets);
      setLastScorer(null);
      setCurrentSet(data.currentSet);
    });

    return () => {
      socket.off("connect");
      socket.off("game-state");
      socket.off("update-score");
      socket.off("reset-score");
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "white",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #475569",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div style={{ fontSize: "2rem" }}>🏐</div>
            <h1
              style={{
                fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
                fontWeight: "bold",
                background: "linear-gradient(to right, #60a5fa, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Volleyball Scoreboard
            </h1>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: "0.5rem",
              background: "transparent",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              color: "white",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            ⚙️
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem" }}>
        {/* Current Set Indicator */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(30, 41, 59, 0.7)",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              border: "1px solid #475569",
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: "clamp(1rem, 4vw, 2rem)",
              }}
            >
              Current Set :
            </span>
            <span
              style={{
                fontSize: "clamp(1rem, 4vw, 2rem)",
                fontWeight: "bold",
                color: "#34d399",
              }}
            >
              {currentSet}
            </span>
          </div>
        </div>

        {/* Main Score Display */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: window.innerWidth >= 768 ? "1fr 1fr" : "1fr",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Team 1 */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9))",
              backdropFilter: "blur(10px)",
              borderRadius: "1rem",
              padding: "clamp(1.5rem, 4vw, 2rem)",
              border: "1px solid #475569",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "clamp(2rem, 6vw, 2.5rem)",
                    height: "clamp(2rem, 6vw, 2.5rem)",
                    borderRadius: "50%",
                    border: "4px solid white",
                    backgroundColor: team1Color,
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  }}
                />
                <h2
                  style={{
                    fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
                    fontWeight: "bold",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {team1Name}
                </h2>
              </div>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {[...Array(team1Sets)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "clamp(0.75rem, 2vw, 1rem)",
                      height: "clamp(0.75rem, 2vw, 1rem)",
                      background: "#34d399",
                      borderRadius: "50%",
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontSize: "clamp(4rem, 15vw, 6rem)",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                  background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {team1Score}
              </div>
              <div
                style={{
                  fontSize: "clamp(0.875rem, 2vw, 1rem)",
                  color: "#94a3b8",
                }}
              >
                Sets: {team1Sets}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => handleScoreChange("team1", 1)}
                style={{
                  background: "linear-gradient(to right, #059669, #047857)",
                  color: "white",
                  fontWeight: "bold",
                  padding: "clamp(1rem, 3vw, 1.25rem)",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "clamp(1rem, 3vw, 1.25rem)",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  transition: "all 0.2s",
                }}
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = "scale(0.95)")
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                +1
              </button>
              <button
                onClick={() => handleScoreChange("team1", -1)}
                style={{
                  background: "linear-gradient(to right, #dc2626, #b91c1c)",
                  color: "white",
                  fontWeight: "bold",
                  padding: "clamp(1rem, 3vw, 1.25rem)",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "clamp(1rem, 3vw, 1.25rem)",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  transition: "all 0.2s",
                }}
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = "scale(0.95)")
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                -1
              </button>
            </div>
          </div>

          {/* Team 2 */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9))",
              backdropFilter: "blur(10px)",
              borderRadius: "1rem",
              padding: "clamp(1.5rem, 4vw, 2rem)",
              border: "1px solid #475569",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "clamp(2rem, 6vw, 2.5rem)",
                    height: "clamp(2rem, 6vw, 2.5rem)",
                    borderRadius: "50%",
                    border: "4px solid white",
                    backgroundColor: team2Color,
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  }}
                />
                <h2
                  style={{
                    fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
                    fontWeight: "bold",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {team2Name}
                </h2>
              </div>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                {[...Array(team2Sets)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: "clamp(0.75rem, 2vw, 1rem)",
                      height: "clamp(0.75rem, 2vw, 1rem)",
                      background: "#34d399",
                      borderRadius: "50%",
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontSize: "clamp(4rem, 15vw, 6rem)",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                  background: "linear-gradient(135deg, #34d399, #10b981)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {team2Score}
              </div>
              <div
                style={{
                  fontSize: "clamp(0.875rem, 2vw, 1rem)",
                  color: "#94a3b8",
                }}
              >
                Sets: {team2Sets}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => handleScoreChange("team2", 1)}
                style={{
                  background: "linear-gradient(to right, #059669, #047857)",
                  color: "white",
                  fontWeight: "bold",
                  padding: "clamp(1rem, 3vw, 1.25rem)",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "clamp(1rem, 3vw, 1.25rem)",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  transition: "all 0.2s",
                }}
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = "scale(0.95)")
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                +1
              </button>
              <button
                onClick={() => handleScoreChange("team2", -1)}
                style={{
                  background: "linear-gradient(to right, #dc2626, #b91c1c)",
                  color: "white",
                  fontWeight: "bold",
                  padding: "clamp(1rem, 3vw, 1.25rem)",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "clamp(1rem, 3vw, 1.25rem)",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  transition: "all 0.2s",
                }}
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = "scale(0.95)")
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                -1
              </button>
            </div>
          </div>
        </div>

        {/* Set History Table */}
        {/* {team1SetsHistory.length > 0 && ( */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              background: "rgba(30, 41, 59, 0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: "1rem",
              padding: "clamp(1rem, 3vw, 1.5rem)",
              border: "1px solid #475569",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            }}
          >
            <h3
              style={{
                fontSize: "clamp(1.125rem, 3vw, 1.25rem)",
                fontWeight: "bold",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              Set History
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "300px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #475569" }}>
                    <th
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "left",
                        fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      }}
                    >
                      Team
                    </th>
                    <th
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "center",
                        fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      }}
                    >
                      Set 1
                    </th>
                    <th
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "center",
                        fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      }}
                    >
                      Set 2
                    </th>
                    <th
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "center",
                        fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      }}
                    >
                      Set 3
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{ borderBottom: "1px solid rgba(71, 85, 105, 0.5)" }}
                  >
                    <td
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        fontWeight: "600",
                        fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      }}
                    >
                      {team1Name}
                    </td>
                    <td
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "center",
                        fontSize: "clamp(1rem, 3vw, 1.25rem)",
                        fontWeight: "bold",
                        color:
                          team1SetsHistory[0] > team2SetsHistory[0]
                            ? "#34d399"
                            : "#94a3b8",
                      }}
                    >
                      {team1SetsHistory[0] || "-"}
                    </td>
                    <td
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "center",
                        fontSize: "clamp(1rem, 3vw, 1.25rem)",
                        fontWeight: "bold",
                        color:
                          team1SetsHistory[1] > team2SetsHistory[1]
                            ? "#34d399"
                            : "#94a3b8",
                      }}
                    >
                      {team1SetsHistory[1] || "-"}
                    </td>
                    <td
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "center",
                        fontSize: "clamp(1rem, 3vw, 1.25rem)",
                        fontWeight: "bold",
                        color:
                          team1SetsHistory[2] > team2SetsHistory[2]
                            ? "#34d399"
                            : "#94a3b8",
                      }}
                    >
                      {team1SetsHistory[2] || "-"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        fontWeight: "600",
                        fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      }}
                    >
                      {team2Name}
                    </td>
                    <td
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "center",
                        fontSize: "clamp(1rem, 3vw, 1.25rem)",
                        fontWeight: "bold",
                        color:
                          team2SetsHistory[0] > team1SetsHistory[0]
                            ? "#34d399"
                            : "#94a3b8",
                      }}
                    >
                      {team2SetsHistory[0] || "-"}
                    </td>
                    <td
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "center",
                        fontSize: "clamp(1rem, 3vw, 1.25rem)",
                        fontWeight: "bold",
                        color:
                          team2SetsHistory[1] > team1SetsHistory[1]
                            ? "#34d399"
                            : "#94a3b8",
                      }}
                    >
                      {team2SetsHistory[1] || "-"}
                    </td>
                    <td
                      style={{
                        padding: "clamp(0.5rem, 2vw, 0.75rem)",
                        textAlign: "center",
                        fontSize: "clamp(1rem, 3vw, 1.25rem)",
                        fontWeight: "bold",
                        color:
                          team2SetsHistory[2] > team1SetsHistory[2]
                            ? "#34d399"
                            : "#94a3b8",
                      }}
                    >
                      {team2SetsHistory[2] || "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* )} */}

        {/* Keyboard Shortcuts Info */}
        <div
          style={{
            marginBottom: "1.5rem",
            background: "rgba(30, 41, 59, 0.5)",
            backdropFilter: "blur(10px)",
            borderRadius: "0.75rem",
            padding: "1rem",
            border: "1px solid #475569",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>⌨️</span>
            <h3
              style={{
                fontSize: "clamp(0.875rem, 2vw, 1rem)",
                fontWeight: "600",
                color: "#cbd5e1",
              }}
            >
              Keyboard Shortcuts
            </h3>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "0.5rem",
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
              color: "#94a3b8",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <kbd
                style={{
                  padding: "0.25rem 0.5rem",
                  background: "#334155",
                  borderRadius: "0.25rem",
                  fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                }}
              >
                1
              </kbd>
              <span>Team 1 +1</span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <kbd
                style={{
                  padding: "0.25rem 0.5rem",
                  background: "#334155",
                  borderRadius: "0.25rem",
                  fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                }}
              >
                2
              </kbd>
              <span>Team 2 +1</span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <kbd
                style={{
                  padding: "0.25rem 0.5rem",
                  background: "#334155",
                  borderRadius: "0.25rem",
                  fontSize: "clamp(0.65rem, 2vw, 0.75rem)",
                }}
              >
                Shift + -
              </kbd>
              <span>Team 1 -1</span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <kbd
                style={{
                  padding: "0.25rem 0.5rem",
                  background: "#334155",
                  borderRadius: "0.25rem",
                  fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                }}
              >
                -
              </kbd>
              <span>Team 2 -1</span>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={resetScore}
            style={{
              background: "linear-gradient(to right, #d97706, #ea580c)",
              color: "white",
              fontWeight: "bold",
              padding: "clamp(1rem, 3vw, 1rem) clamp(2rem, 6vw, 3rem)",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "clamp(1rem, 3vw, 1.125rem)",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.95)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          >
            🔄 Reset Match
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(10px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              borderRadius: "1rem",
              padding: "clamp(1.5rem, 4vw, 2rem)",
              maxWidth: "42rem",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid #475569",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2rem)",
                  fontWeight: "bold",
                }}
              >
                Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: "0.5rem",
                  background: "transparent",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "1.5rem",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#334155")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Team 1 Settings */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "clamp(1.125rem, 3vw, 1.25rem)",
                    fontWeight: "600",
                    color: "#60a5fa",
                  }}
                >
                  Team 1
                </h3>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      fontWeight: "500",
                      color: "#cbd5e1",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Team Name
                  </label>
                  <input
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "clamp(0.75rem, 2vw, 0.75rem)",
                      borderRadius: "0.5rem",
                      background: "#334155",
                      color: "white",
                      border: "1px solid #475569",
                      fontSize: "clamp(1rem, 2vw, 1rem)",
                      outline: "none",
                    }}
                    placeholder="Enter team 1 name"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      fontWeight: "500",
                      color: "#cbd5e1",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Team Color
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <input
                      type="color"
                      value={team1Color}
                      onChange={(e) => setTeam1Color(e.target.value)}
                      style={{
                        width: "clamp(3rem, 10vw, 4rem)",
                        height: "clamp(3rem, 10vw, 4rem)",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        border: "2px solid #475569",
                      }}
                    />
                    <span
                      style={{
                        color: "#94a3b8",
                        fontFamily: "monospace",
                        fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      }}
                    >
                      {team1Color}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team 2 Settings */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "clamp(1.125rem, 3vw, 1.25rem)",
                    fontWeight: "600",
                    color: "#34d399",
                  }}
                >
                  Team 2
                </h3>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      fontWeight: "500",
                      color: "#cbd5e1",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Team Name
                  </label>
                  <input
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "clamp(0.75rem, 2vw, 0.75rem)",
                      borderRadius: "0.5rem",
                      background: "#334155",
                      color: "white",
                      border: "1px solid #475569",
                      fontSize: "clamp(1rem, 2vw, 1rem)",
                      outline: "none",
                    }}
                    placeholder="Enter team 2 name"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      fontWeight: "500",
                      color: "#cbd5e1",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Team Color
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <input
                      type="color"
                      value={team2Color}
                      onChange={(e) => setTeam2Color(e.target.value)}
                      style={{
                        width: "clamp(3rem, 10vw, 4rem)",
                        height: "clamp(3rem, 10vw, 4rem)",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        border: "2px solid #475569",
                      }}
                    />
                    <span
                      style={{
                        color: "#94a3b8",
                        fontFamily: "monospace",
                        fontSize: "clamp(0.875rem, 2vw, 1rem)",
                      }}
                    >
                      {team2Color}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: "#2563eb",
                  color: "white",
                  fontWeight: "bold",
                  padding:
                    "clamp(0.75rem, 2vw, 0.75rem) clamp(1.5rem, 4vw, 1.5rem)",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "clamp(1rem, 2vw, 1rem)",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1d4ed8")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#2563eb")
                }
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Finished Popup */}
      {showMatchFinishedPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            animation: "fadeIn 0.3s ease-in-out",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              borderRadius: "1.5rem",
              padding: "clamp(2rem, 5vw, 3rem)",
              maxWidth: "500px",
              width: "100%",
              border: "2px solid #34d399",
              boxShadow: "0 25px 50px -12px rgba(52, 211, 153, 0.3)",
              textAlign: "center",
              animation: "slideUp 0.4s ease-out",
            }}
          >
            {/* Trophy Animation */}
            <div
              style={{
                fontSize: "clamp(4rem, 12vw, 6rem)",
                marginBottom: "1rem",
                animation: "bounce 1s infinite",
              }}
            >
              🏆
            </div>

            {/* Winner Announcement */}
            <h2
              style={{
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                fontWeight: "bold",
                marginBottom: "1rem",
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Match Finished!
            </h2>

            <div
              style={{
                background: "rgba(52, 211, 153, 0.1)",
                padding: "1.5rem",
                borderRadius: "1rem",
                marginBottom: "2rem",
                border: "1px solid rgba(52, 211, 153, 0.3)",
              }}
            >
              <p
                style={{
                  fontSize: "clamp(1rem, 3vw, 1.25rem)",
                  color: "#94a3b8",
                  marginBottom: "0.5rem",
                }}
              >
                🎉 Winner 🎉
              </p>
              <p
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2rem)",
                  fontWeight: "bold",
                  color: "#34d399",
                }}
              >
                {matchWinner}
              </p>
            </div>

            {/* Final Score Summary */}
            <div
              style={{
                background: "rgba(30, 41, 59, 0.5)",
                padding: "1rem",
                borderRadius: "0.75rem",
                marginBottom: "2rem",
                fontSize: "clamp(0.875rem, 2vw, 1rem)",
                color: "#cbd5e1",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>{team1Name}</strong>: {team1Sets} sets
              </div>
              <div>
                <strong>{team2Name}</strong>: {team2Sets} sets
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                flexDirection: window.innerWidth < 640 ? "column" : "row",
                gap: "1rem",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => {
                  resetAll();
                }}
                style={{
                  background: "linear-gradient(to right, #34d399, #10b981)",
                  color: "white",
                  fontWeight: "bold",
                  padding:
                    "clamp(0.875rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "clamp(1rem, 2vw, 1.125rem)",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  transition: "all 0.2s",
                  flex: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 12px rgba(52, 211, 153, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 6px rgba(0, 0, 0, 0.3)";
                }}
              >
                🔄 New Match
              </button>

              <button
                onClick={() => setShowMatchFinishedPopup(false)}
                style={{
                  background: "rgba(51, 65, 85, 0.8)",
                  color: "white",
                  fontWeight: "600",
                  padding:
                    "clamp(0.875rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)",
                  border: "1px solid #475569",
                  borderRadius: "0.75rem",
                  fontSize: "clamp(1rem, 2vw, 1.125rem)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  flex: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(71, 85, 105, 0.8)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(51, 65, 85, 0.8)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Keep Scores
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Control;
