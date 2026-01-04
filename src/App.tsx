import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Control from "./pages/Control";
import Scoreboard from "./pages/Scoreboard";
// import HistoryMatch from './pages/HistoryMatch'; // Import the renamed HistoryMatch component
import LineUp from "./pages/LineUp";
import Home from "./pages/home";
import PlayerManagement from "./pages/PlayerManagement";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/control" element={<Control />} />
        <Route path="/scoreboard" element={<Scoreboard />} />
        {/* <Route path="/history-match" element={<HistoryMatch currentSet={3} team1Sets={2} team2Sets={1} />} /> */}
        <Route path="/players" element={<PlayerManagement />} />
        <Route path="/lineup" element={<LineUp />} />
      </Routes>
    </Router>
  );
};

export default App;
