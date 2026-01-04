# 🚀 Quick Start Guide for New Developers

## 📋 Prerequisites

- Node.js 18+ installed
- Basic knowledge of React, TypeScript, and Socket.IO
- Text editor (VS Code recommended)

## 🔧 Initial Setup

### 1. Clone and Install

```bash
cd ent_vb_score_management
npm install
```

### 2. Create Environment File

Create `.env` in the root directory:

```env
# Server Configuration
VITE_SOCKET_URL=http://localhost:4000

# Optional
VITE_APP_NAME=Volleyball Score Manager
```

### 3. Start Development Servers

**Terminal 1 - Frontend:**

```bash
npm run dev
```

Access at: `http://localhost:5173`

**Terminal 2 - Backend (Socket.IO):**

```bash
node server.js
```

Socket server runs on: `http://localhost:4000`

## 🏗️ Project Structure

```
ent_vb_score_management/
├── src/
│   ├── pages/
│   │   ├── home.tsx              # Main navigation
│   │   ├── Control.tsx           # Match control panel (⚠️ 1487 lines - needs refactoring)
│   │   ├── Scoreboard.tsx        # Live scoreboard display
│   │   ├── PlayerManagement.tsx  # Team/player roster management
│   │   ├── LineUp.tsx            # Lineup poster generator
│   │   ├── ScoreDisplay.tsx      # Score display component
│   │   └── HistoryMatch.tsx      # Match history (not fully implemented)
│   ├── App.tsx                   # Main app with routing
│   ├── main.tsx                  # Entry point
│   └── assets/                   # Images and static files
├── server.js                     # Socket.IO server
├── package.json
└── vite.config.ts
```

## 🔑 Key Components Explained

### Control.tsx (Score Controller)

- **Purpose:** Main control panel for match officials
- **Key Functions:**
  - `handleScoreChange()` - Updates team scores
  - `checkForSetWinner()` - Determines set winners
  - `resetScoresForNextSet()` - Advances to next set
- **Socket Events:**
  - Emits: `update-score`, `reset-scores`, `reset-match`
  - Listens: None (controller only emits)

### Scoreboard.tsx (Public Display)

- **Purpose:** Public-facing scoreboard
- **Key Functions:**
  - Listens to Socket.IO for score updates
  - Auto-updates in real-time
- **Socket Events:**
  - Listens: `score-update`, `reset-scores`, `reset-match`

### PlayerManagement.tsx (Roster Manager)

- **Purpose:** Manage team rosters
- **Storage:** localStorage
- **Data Structure:**
  ```typescript
  {
    allTeams: Team[],
    activeTeamId: string
  }
  ```

### LineUp.tsx (Poster Generator)

- **Purpose:** Create lineup graphics
- **Features:**
  - 7-player lineup
  - Player photos
  - Export to PNG
  - OCR name extraction (removed in latest version)

## 🌐 Network Configuration

### For Local Testing

Use `localhost` in Control.tsx:

```typescript
const socket = io("http://localhost:4000", {
  transports: ["websocket"],
});
```

### For Same Network (Multiple Devices)

1. Find your computer's IP address:

   ```bash
   # macOS/Linux
   ifconfig | grep inet

   # Windows
   ipconfig
   ```

2. Update Control.tsx:

   ```typescript
   const socket = io("http://YOUR_IP_HERE:4000", {
     transports: ["websocket"],
   });
   ```

3. Access from other devices:
   - Control Panel: `http://YOUR_IP:5173/control`
   - Scoreboard: `http://YOUR_IP:5173/scoreboard`

## 📱 Common Use Cases

### Scenario 1: Single Device Testing

1. Open two browser windows
2. Window 1: `/control` (to control scores)
3. Window 2: `/scoreboard` (to view live scores)

### Scenario 2: Two-Device Setup (Recommended)

1. **Device 1 (Laptop):** Control panel at `/control`
2. **Device 2 (TV/Projector):** Scoreboard at `/scoreboard`

### Scenario 3: Full Production

1. **Referee Tablet:** `/control`
2. **Main Display:** `/scoreboard`
3. **Score Table:** `/scoreboard` (duplicate)
4. **Mobile:** Any page for quick access

## 🐛 Troubleshooting

### Socket Connection Failed

```
❌ Error: xhr poll error
```

**Solution:**

1. Check `server.js` is running
2. Verify IP address matches in Control.tsx
3. Check firewall allows port 4000
4. Ensure devices on same network

### Scores Not Updating

**Solution:**

1. Open browser console (F12)
2. Check for Socket.IO errors
3. Verify Socket.IO connection status
4. Restart both frontend and server

### localStorage Data Lost

**Solution:**

- Browser clears localStorage on private mode
- Export teams before closing
- Consider implementing cloud backup

### Page Not Loading

```
❌ Cannot GET /scoreboard
```

**Solution:**

- In development, use hash routing or ensure dev server handles routes
- Check `App.tsx` routes are correct
- Clear browser cache

## 🎨 Customization Quick Tips

### Change Team Colors

Edit default colors in `Control.tsx`:

```typescript
const [team1Color, setTeam1Color] = useState("#YOUR_COLOR");
const [team2Color, setTeam2Color] = useState("#YOUR_COLOR");
```

### Modify Scoring Rules

Edit `checkForSetWinner()` in `Control.tsx`:

```typescript
// Example: Change from 25 to 21 points
if (team1Score == 21 && team1Score - team2Score > 1) {
  // Win logic
}
```

### Add Custom Sounds

```bash
npm install use-sound
```

```typescript
import useSound from "use-sound";

const [playScore] = useSound("/sounds/score.mp3");
// Trigger on score update
```

## 📦 Building for Production

### Build the App

```bash
npm run build
```

Output in `dist/` folder

### Preview Production Build

```bash
npm run preview
```

### Deploy to Vercel/Netlify

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Note:** Socket.IO server needs separate deployment (Heroku, Railway, etc.)

## 🧪 Testing Checklist

Before passing to next developer, verify:

- [ ] Both terminals start without errors
- [ ] Home page loads and all buttons work
- [ ] Control panel updates scores in real-time
- [ ] Scoreboard receives updates
- [ ] Player management saves and loads teams
- [ ] Lineup page generates PNG correctly
- [ ] Score persists between sets
- [ ] Match winner determined correctly
- [ ] Can reset match successfully
- [ ] Works on different browsers (Chrome, Safari, Firefox)

## 📚 Important Files to Review

1. **Control.tsx** - Most complex, needs refactoring
2. **server.js** - Simple but critical for real-time updates
3. **PlayerManagement.tsx** - localStorage schema reference
4. **App.tsx** - Routing structure

## 🔄 Development Workflow

### Making Changes

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test locally
4. Commit: `git commit -m "Description"`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

### Code Style

- Use TypeScript for type safety
- Follow existing Tailwind CSS patterns
- Add comments for complex logic
- Keep functions under 50 lines when possible

## 🆘 Getting Help

### Resources

- [React Docs](https://react.dev)
- [Socket.IO Docs](https://socket.io/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Debug Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for outdated packages
npm outdated
```

## 🎯 First Tasks for New Developer

### Easy (1-2 hours)

1. Add your name to README
2. Update VITE_SOCKET_URL to use environment variable
3. Add a loading spinner to Scoreboard
4. Change default team colors

### Medium (3-5 hours)

1. Add keyboard shortcuts for scoring
2. Implement dark mode
3. Add match timer
4. Export match data to JSON

### Hard (1-2 days)

1. Refactor Control.tsx into smaller components
2. Add match history feature
3. Implement statistics dashboard
4. Add unit tests

---

**Good luck! 🎉**  
Remember: Read IMPROVEMENT_ROADMAP.md for long-term vision and feature ideas.
