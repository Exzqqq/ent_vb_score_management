import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaSave, FaUsers } from "react-icons/fa";

export interface TeamPlayer {
  id: string;
  name: string;
  jerseyNumber?: string;
}

export interface Team {
  id: string;
  name: string;
  players: TeamPlayer[];
  createdAt: number;
}

const PlayerManagement: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string>("");
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerJersey, setNewPlayerJersey] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load all teams on mount
  useEffect(() => {
    const savedTeams = localStorage.getItem("allTeams");
    const savedActiveTeamId = localStorage.getItem("activeTeamId");

    if (savedTeams) {
      try {
        const teamsData = JSON.parse(savedTeams);
        setTeams(teamsData);

        // Load active team or first team
        const teamIdToLoad = savedActiveTeamId || teamsData[0]?.id;
        if (teamIdToLoad) {
          loadTeam(teamIdToLoad, teamsData);
        }
      } catch (e) {
        console.error("Failed to load teams:", e);
      }
    }
  }, []);

  const loadTeam = (teamId: string, teamsData?: Team[]) => {
    const teamsList = teamsData || teams;
    const team = teamsList.find((t) => t.id === teamId);
    if (team) {
      setActiveTeamId(team.id);
      setTeamName(team.name);
      setPlayers(team.players);
      setIsCreatingNew(false);
      localStorage.setItem("activeTeamId", team.id);
    }
  };

  const handleNewTeam = () => {
    setIsCreatingNew(true);
    setActiveTeamId("");
    setTeamName("");
    setPlayers([]);
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) {
      alert("Please enter a player name");
      return;
    }

    const newPlayer: TeamPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      jerseyNumber: newPlayerJersey.trim() || undefined,
    };

    setPlayers([...players, newPlayer]);
    setNewPlayerName("");
    setNewPlayerJersey("");
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    if (!teamName.trim()) {
      alert("Please enter a team name");
      return;
    }

    let updatedTeams: Team[];

    if (isCreatingNew || !activeTeamId) {
      // Create new team
      const newTeam: Team = {
        id: Date.now().toString(),
        name: teamName.trim(),
        players: players,
        createdAt: Date.now(),
      };
      updatedTeams = [...teams, newTeam];
      setActiveTeamId(newTeam.id);
      setIsCreatingNew(false);
    } else {
      // Update existing team
      updatedTeams = teams.map((t) =>
        t.id === activeTeamId
          ? { ...t, name: teamName.trim(), players: players }
          : t
      );
    }

    setTeams(updatedTeams);
    localStorage.setItem("allTeams", JSON.stringify(updatedTeams));
    localStorage.setItem(
      "activeTeamId",
      activeTeamId || updatedTeams[updatedTeams.length - 1].id
    );

    // Update legacy format for backward compatibility
    localStorage.setItem("teamName", teamName);
    localStorage.setItem("teamPlayers", JSON.stringify(players));

    alert("Team saved successfully! ✅");
  };

  const handleDeleteTeam = () => {
    if (!activeTeamId) return;

    if (!confirm(`Are you sure you want to delete "${teamName}"?`)) return;

    const updatedTeams = teams.filter((t) => t.id !== activeTeamId);
    setTeams(updatedTeams);
    localStorage.setItem("allTeams", JSON.stringify(updatedTeams));

    // Load first team or clear
    if (updatedTeams.length > 0) {
      loadTeam(updatedTeams[0].id, updatedTeams);
    } else {
      setActiveTeamId("");
      setTeamName("");
      setPlayers([]);
      localStorage.removeItem("activeTeamId");
      localStorage.removeItem("teamName");
      localStorage.removeItem("teamPlayers");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddPlayer();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 to-slate-900 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
            Team Management
          </h1>

          <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6">
            Manage your team rosters
          </p>
          {/* Team Selector */}
          <div className="mb-4 bg-blue-50 p-3 sm:p-4 rounded-lg">
            <div className="flex flex-col gap-2 sm:gap-3">
              <label className="text-sm sm:text-base text-gray-700 font-semibold">
                Current Team:
              </label>
              <select
                value={activeTeamId}
                onChange={(e) => loadTeam(e.target.value)}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                disabled={isCreatingNew}
              >
                {teams.length === 0 && <option value="">No teams yet</option>}
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.players.length} players)
                  </option>
                ))}
              </select>
              <button
                onClick={handleNewTeam}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
              >
                <FaPlus /> New Team
              </button>
            </div>

            {isCreatingNew && (
              <p className="text-blue-600 text-sm mt-2 text-center font-medium">
                Creating new team...
              </p>
            )}
          </div>

          {/* Team Name Section */}
          <div className="mb-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
            <label className="block text-gray-700 text-xs sm:text-sm font-bold mb-2">
              Team Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          {/* Add Player Section */}
          <div className="mb-4 bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
              Add New Player
            </h2>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Player name"
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <input
                type="text"
                value={newPlayerJersey}
                onChange={(e) => setNewPlayerJersey(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Jersey # (optional)"
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <button
                onClick={handleAddPlayer}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
              >
                <FaPlus /> Add
              </button>
            </div>
          </div>

          {/* Players List */}
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
              Team Roster ({players.length} players)
            </h2>
            {players.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No players added yet. Add your first player above!
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {player.jerseyNumber && (
                        <span className="bg-blue-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                          #{player.jerseyNumber}
                        </span>
                      )}
                      <span className="text-gray-800 font-medium">
                        {player.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="text-red-500 hover:text-red-700 p-2 transition-colors"
                      title="Remove player"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
            <button
              onClick={handleSave}
              disabled={!teamName.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg flex items-center justify-center gap-2 text-base sm:text-lg font-semibold transition-colors"
            >
              <FaSave />{" "}
              {isCreatingNew || !activeTeamId ? "Create Team" : "Save Changes"}
            </button>

            {activeTeamId && !isCreatingNew && (
              <button
                onClick={handleDeleteTeam}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg flex items-center justify-center gap-2 text-base sm:text-lg font-semibold transition-colors"
              >
                <FaTrash /> Delete Team
              </button>
            )}
          </div>

          {!teamName.trim() && (
            <p className="text-gray-500 text-center mt-4 text-sm">
              Please enter a team name
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerManagement;
