import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { SOCKET_CONFIG } from "../config";

const socket = io(SOCKET_CONFIG.SERVER_URL);

const Scoreboard: React.FC = () => {
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [team1Color, setTeam1Color] = useState("blue");
  const [team2Color, setTeam2Color] = useState("green");
  const [lastScorer, setLastScorer] = useState<"team1" | "team2" | null>(null);
  const [team1Sets, setTeam1Sets] = useState(0);
  const [team2Sets, setTeam2Sets] = useState(0);

  const prevScores = useRef<{ team1Score: number; team2Score: number }>({
    team1Score: 0,
    team2Score: 0,
  });

  const volleyballIcon = (
    <div
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundColor: "black",
      }}
    />
  );

  useEffect(() => {
    console.log("Scoreboard: Setting up socket listeners");

    socket.on("connect", () => {
      console.log("Scoreboard: Connected to server");
    });

    socket.on("update-score", (data) => {
      console.log("Scoreboard: Received update-score event", data);
      console.log("Before setState - Current scores:", {
        team1Score,
        team2Score,
      });
      setTeam1Name(data.team1Name);
      setTeam2Name(data.team2Name);
      setTeam1Score(data.team1Score);
      setTeam2Score(data.team2Score);
      setTeam1Color(data.team1Color);
      setTeam2Color(data.team2Color);
      setTeam1Sets(data.team1Sets);
      setTeam2Sets(data.team2Sets);
      console.log(
        "After setState calls - Setting scores to:",
        data.team1Score,
        data.team2Score
      );

      // Check if there is a change in the score and update lastScorer accordingly
      if (data.team1Score > prevScores.current.team1Score) {
        setLastScorer("team1");
      } else if (data.team2Score > prevScores.current.team2Score) {
        setLastScorer("team2");
      }

      // Update the ref to the current scores for the next comparison
      prevScores.current = {
        team1Score: data.team1Score,
        team2Score: data.team2Score,
      };
    });

    return () => {
      socket.off("connect");
      socket.off("update-score");
    };
  }, []);

  const getDynamicFontSize = (name: string) => {
    if (name.length > 15) return "text-lg";
    if (name.length > 10) return "text-xl";
    return "text-3xl";
  };

  console.log("Scoreboard render:", {
    team1Score,
    team2Score,
    team1Sets,
    team2Sets,
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-white">
      <div className="flex flex-col space-y-4">
        <div
          className="flex items-center space-x-3 min-w-[500px]"
          key={`team1-${team1Score}-${team1Sets}`}
        >
          <span
            className={`font-semibold text-center truncate ${getDynamicFontSize(
              team1Name
            )}`}
            style={{
              width: "200px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginLeft: "50px",
            }}
          >
            {team1Name}
          </span>
          <div
            style={{
              backgroundColor: team1Color,
              width: "30px",
              height: "30px",
              marginLeft: "-5px",
              borderRadius: "50%",
              border: "2px solid black",
            }}
          />
          <div
            className="flex items-center justify-center w-12 h-12"
            style={{ marginLeft: "5px", fontSize: "30px" }}
          >
            {lastScorer === "team1" && volleyballIcon}
          </div>
          <span
            className="font-bold text-center"
            style={{
              marginLeft: "20px",
              fontSize: "60px",
              minWidth: "80px",
              color: "black",
            }}
          >
            {team1Score}
          </span>
        </div>

        <div
          className="flex items-center space-x-3 min-w-[500px]"
          key={`team2-${team2Score}-${team2Sets}`}
        >
          <span
            className={`font-semibold text-center truncate ${getDynamicFontSize(
              team2Name
            )}`}
            style={{
              width: "200px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginLeft: "50px",
            }}
          >
            {team2Name}
          </span>
          <div
            style={{
              backgroundColor: team2Color,
              width: "30px",
              height: "30px",
              marginLeft: "-5px",
              borderRadius: "50%",
              border: "2px solid black",
            }}
          />
          <div
            className="flex items-center justify-center w-12 h-12"
            style={{ marginLeft: "5px", fontSize: "30px" }}
          >
            {lastScorer === "team2" && volleyballIcon}
          </div>
          <span
            className="font-bold text-center"
            style={{
              marginLeft: "20px",
              fontSize: "60px",
              minWidth: "80px",
              color: "black",
            }}
          >
            {team2Score}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
