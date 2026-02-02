# 🎮 Dungeon Crawler - Quick Start Guide

## 🚀 Getting Started in 3 Steps!

### Step 1: Extract Files
Unzip `dungeon-crawler-multiplayer.zip` to a folder on your computer.

### Step 2: Choose Your Mode

#### 🎯 Singleplayer (No Setup Required)
Just open `index.html` in your browser and play!
- All original features work
- Save/Load available
- No internet needed

#### 👥 Multiplayer (Requires Server)

1. **Install Node.js** (one-time setup)
   - Download: https://nodejs.org/
   - Install and restart your computer

2. **Install Dependencies** (one-time setup)
   ```bash
   npm install
   ```

3. **Start Server** (every time you want to play)
   ```bash
   npm start
   ```
   
   Or on Windows, double-click: `start-server.bat` (if you create it)

4. **Open Game**
   - Go to: `http://localhost:3000`
   - Or open `index.html` in browser

5. **Play with Friends**
   - Click **MULTIPLAYER** → **CREATE ROOM**
   - Share the 6-character room code
   - Friends join with the code
   - Host clicks **START GAME**

## 🎮 Controls

- **WASD / Arrow Keys** - Move
- **Mouse** - Aim
- **Hold Click** - Shoot
- **1-3** - Switch weapons
- **E** - Interact/Enter doors
- **Q** - Drop weapon

## 💡 Tips

### Singleplayer
- Save often! (Pause menu → Save Game)
- Explore to find shops, gear, and weapons
- Every 5th floor has a boss
- Find keys to unlock boss rooms

### Multiplayer
- Stick together! It's safer
- Host has slightly more lag due to enemy AI
- Use chat to coordinate
- Share money and ammo strategically
- Host should have good internet connection

## 📝 What's New

### ✅ Fixed
- **FPS-Independent Movement** - Same speed on all monitors!
- **Save/Load Persistence** - Dungeon layout saves correctly
- **Melee Weapon** - Knife works after loading

### 🆕 Added
- **Multiplayer Co-op** - Up to 4 players!
- **Real-time Sync** - See friends move and shoot
- **In-game Chat** - Communicate with team
- **Room System** - Easy joining with codes

## 🐛 Common Issues

**"Can't connect to server"**
→ Make sure you ran `npm start` first

**"Room not found"**
→ Check the code (case-sensitive, 6 characters)

**Players not syncing**
→ Refresh the page, check internet

**Game too fast/slow**
→ This is now fixed! Should be consistent

## 📖 Full Documentation

- `MULTIPLAYER_README.md` - Complete multiplayer guide
- `FPS_FIX_EXPLANATION.md` - Technical details on FPS fix
- `BUG_FIXES.md` - List of all fixes

## 🎯 Server Files

**You need these for multiplayer:**
- `server.js` - The WebSocket server
- `package.json` - Dependencies
- `multiplayer.js` - Client code (auto-loaded)

**You DON'T need the server for singleplayer!**

## 🌐 Playing Online (Optional)

To play with friends over the internet:

1. Deploy `server.js` to a hosting service:
   - Heroku (free)
   - Railway (free)
   - Replit (free)
   - DigitalOcean ($5/mo)

2. Update `multiplayer.js` line 23:
   ```javascript
   const host = 'your-server.com';
   ```

3. Share your server URL with friends

## 🎊 Have Fun!

Enjoy the bug-free, multiplayer-enabled, FPS-independent dungeon crawler!

Questions? Check the README files or the game's controls section.

---

**Made with ❤️ by Claude**
