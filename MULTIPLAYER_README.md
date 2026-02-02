# Dungeon Crawler RPG - Multiplayer Edition

## 🎮 Features

### Singleplayer
- Original dungeon crawler experience
- All original features: mini-bosses, gear, weapons, etc.
- Save/Load functionality
- FPS-independent movement

### Multiplayer (NEW!)
- **Up to 4 players** can play together in co-op
- **Shared dungeon** - all players explore the same rooms
- **Real-time synchronization** - see other players move and shoot
- **Room codes** - easy joining with 6-character codes
- **Host-controlled** enemies - one player (host) manages enemy AI
- **Chat system** - communicate with your team
- **All difficulties** available in multiplayer

## 🚀 Quick Start (Multiplayer)

### Option 1: Play Locally (Same Network)

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Verify: `node --version` (should show v14 or higher)

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```
   
   You should see: `Server running on http://localhost:3000`

4. **Open the Game**
   - Open your browser and go to: `http://localhost:3000`
   - Or open `index.html` directly (will connect to localhost:3000)

5. **Create or Join a Room**
   - Click **MULTIPLAYER** → **CREATE ROOM**
   - Choose difficulty and share the 6-character room code
   - Other players click **JOIN ROOM** and enter the code
   - Host clicks **START GAME** when everyone is ready

### Option 2: Play Online (Different Networks)

If you want to play with friends over the internet, you'll need to:

1. Deploy the server to a hosting service like:
   - **Heroku** (free tier available)
   - **Railway** (free tier available)
   - **DigitalOcean** ($5/month)
   - **AWS/Azure/GCP**

2. Update `multiplayer.js` line 23 to point to your server:
   ```javascript
   const host = 'your-server-domain.com';
   ```

3. Share your server URL with friends

## 🎯 How Multiplayer Works

### Room System
- **Create Room**: Host creates a room with a 6-character code
- **Join Room**: Players enter the code to join
- **4 Player Max**: Up to 4 players per room
- **Host Controls**: Host starts the game and manages enemy AI

### Gameplay
- **Shared World**: All players see the same dungeon layout
- **Individual Progress**: Each player has their own health, weapons, and gear
- **Cooperative**: Work together to clear rooms and progress
- **Real-time**: See other players' movements and shots instantly
- **Auto-sync**: Enemies, items, and room state synchronized automatically

### Combat
- **Everyone can shoot**: All players deal damage to enemies
- **Shared enemy pool**: Enemies target all players
- **Host manages AI**: Only the host's game handles enemy movement
- **Synchronized bullets**: See everyone's bullets in real-time

### Communication
- **In-game chat**: Send messages to your team
- **Room codes**: Easy way to invite friends
- **Player list**: See who's in your game

## 🔧 Technical Details

### Client-Server Architecture
```
Client (Browser) <--WebSocket--> Server (Node.js) <--WebSocket--> Client (Browser)
```

### Network Protocol
- **WebSocket**: Real-time bidirectional communication
- **JSON Messages**: All data sent as JSON
- **Event-based**: Different message types for different actions

### Message Types
- `create_room` - Create a new multiplayer room
- `join_room` - Join an existing room
- `start_game` - Host starts the game
- `player_update` - Player position/state update (50ms intervals)
- `player_shoot` - Player fired a bullet
- `enemy_update` - Enemy positions (host only, 100ms intervals)
- `item_pickup` - Player picked up an item
- `chat_message` - Send chat message
- `ping/pong` - Keep connection alive

### Performance
- **Player updates**: 20 times per second (50ms)
- **Enemy updates**: 10 times per second (100ms, host only)
- **Bandwidth**: ~5-10 KB/s per player
- **Latency**: Works well up to 200ms ping

## 🐛 Troubleshooting

### "Failed to connect to server"
- Make sure the server is running (`npm start`)
- Check if port 3000 is available
- Try: `http://localhost:3000` in your browser
- Check firewall settings

### "Room not found"
- Room code is case-sensitive (auto-uppercased)
- Code must be exactly 6 characters
- Room may have been deleted (empty for too long)

### "Game already started"
- Can't join after the host started the game
- Wait for a new room or create your own

### Players not syncing
- Check internet connection
- Refresh the page
- Make sure all players are on the same game version

### Lag/Stuttering
- Check your internet speed
- Close other network-intensive applications
- Reduce number of players
- Host should have good connection

## 📁 File Structure

```
dungeon-crawler-multiplayer/
├── server.js              # WebSocket server
├── multiplayer.js         # Client-side multiplayer code
├── package.json           # Server dependencies
├── index.html            # Updated with multiplayer UI
├── menu.js               # Updated with multiplayer menus
├── rendering.js          # Updated to draw other players
├── game.js               # Updated with FPS fix & multiplayer hooks
├── weapons.js            # Updated to send shoot events
├── styles.css            # Updated with multiplayer styles
└── [all other game files remain the same]
```

## 🎨 UI Changes

### Main Menu
- New "MULTIPLAYER" button
- Create Room / Join Room options
- Room code display

### Lobby Screen
- Shows room code (share with friends)
- Player list with host indicator
- Start button (host only)
- Leave button

### In-Game
- Multiplayer panel shows connected players
- Chat box for communication
- Other players rendered in pink
- Health bars above other players

## 🔒 Security Notes

This is a basic implementation suitable for playing with friends. For production use:
- Add authentication
- Implement rate limiting
- Add input validation
- Use HTTPS/WSS
- Add anti-cheat measures
- Implement proper error handling

## 📝 Known Limitations

- No save/load in multiplayer (singleplayer only)
- Can't pause in multiplayer
- Shops are individual (each player sees different items)
- No spectator mode
- No player colors customization (yet)
- No voice chat (text only)

## 🎯 Future Improvements

- [ ] Player name tags
- [ ] Different player colors
- [ ] Revive/respawn system
- [ ] Shared loot system
- [ ] PvP mode
- [ ] More than 4 players
- [ ] Reconnection support
- [ ] Matchmaking system
- [ ] Leaderboards

## 🤝 Credits

- Original game: Dungeon Crawler RPG
- Multiplayer by: Claude (Anthropic)
- FPS fix: Delta time implementation

## 📜 License

Same as the original game. For personal/educational use.

---

**Have fun playing with friends!** 🎮👥
