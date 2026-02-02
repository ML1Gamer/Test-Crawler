// Multiplayer client handler
const multiplayer = {
    enabled: false,
    ws: null,
    roomCode: null,
    playerId: null,
    playerName: null,
    isHost: false,
    players: new Map(), // Other players in the room
    lastUpdateSent: 0,
    updateInterval: 50, // Send updates every 50ms
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
};

// Generate unique player ID
function generatePlayerId() {
    return 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// Connect to server
function connectToServer() {
    return new Promise((resolve, reject) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:3000';
        
        try {
            multiplayer.ws = new WebSocket(`${protocol}//${host}`);
            
            multiplayer.ws.onopen = () => {
                console.log('Connected to multiplayer server');
                multiplayer.reconnectAttempts = 0;
                resolve();
            };

            multiplayer.ws.onclose = () => {
                console.log('Disconnected from server');
                if (multiplayer.enabled && multiplayer.reconnectAttempts < multiplayer.maxReconnectAttempts) {
                    setTimeout(() => {
                        multiplayer.reconnectAttempts++;
                        console.log(`Reconnecting... (${multiplayer.reconnectAttempts}/${multiplayer.maxReconnectAttempts})`);
                        connectToServer().catch(() => {});
                    }, 2000);
                }
            };

            multiplayer.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            multiplayer.ws.onmessage = handleServerMessage;
        } catch (error) {
            reject(error);
        }
    });
}

// Handle messages from server
function handleServerMessage(event) {
    try {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'room_created':
                multiplayer.roomCode = data.roomCode;
                multiplayer.playerId = data.playerId;
                multiplayer.isHost = true;
                showMultiplayerLobby();
                break;

            case 'room_joined':
                multiplayer.roomCode = data.roomCode;
                multiplayer.playerId = data.playerId;
                multiplayer.isHost = false;
                updatePlayerList(data.players);
                showMultiplayerLobby();
                break;

            case 'player_joined':
                updatePlayerList(data.players);
                addChatMessage('System', `${data.playerName} joined the game`);
                break;

            case 'player_left':
                updatePlayerList(data.players);
                multiplayer.players.delete(data.playerId);
                addChatMessage('System', `Player left the game`);
                break;

            case 'game_started':
                startMultiplayerGame(data.difficulty);
                break;

            case 'player_moved':
                updateOtherPlayer(data);
                break;

            case 'player_shot':
                handleOtherPlayerShot(data);
                break;

            case 'enemies_sync':
                if (!multiplayer.isHost) {
                    syncEnemies(data.enemies);
                }
                break;

            case 'item_picked':
                removePickedItem(data.itemId);
                break;

            case 'room_changed':
                // Handle other player changing rooms
                break;

            case 'chat_message':
                addChatMessage(data.playerName, data.message);
                break;

            case 'error':
                alert(data.message);
                break;

            case 'pong':
                // Heartbeat response
                break;
        }
    } catch (error) {
        console.error('Error handling server message:', error);
    }
}

// Create multiplayer room
async function createMultiplayerRoom(difficulty) {
    multiplayer.enabled = true;
    multiplayer.playerId = generatePlayerId();
    multiplayer.playerName = prompt('Enter your name:', 'Player') || 'Player';

    try {
        await connectToServer();
        
        multiplayer.ws.send(JSON.stringify({
            type: 'create_room',
            playerId: multiplayer.playerId,
            playerName: multiplayer.playerName,
            difficulty: difficulty
        }));
    } catch (error) {
        alert('Failed to connect to server. Please make sure the server is running.');
        multiplayer.enabled = false;
    }
}

// Join multiplayer room
async function joinMultiplayerRoom(roomCode) {
    multiplayer.enabled = true;
    multiplayer.playerId = generatePlayerId();
    multiplayer.playerName = prompt('Enter your name:', 'Player') || 'Player';

    try {
        await connectToServer();
        
        multiplayer.ws.send(JSON.stringify({
            type: 'join_room',
            playerId: multiplayer.playerId,
            playerName: multiplayer.playerName,
            roomCode: roomCode.toUpperCase()
        }));
    } catch (error) {
        alert('Failed to connect to server. Please make sure the server is running.');
        multiplayer.enabled = false;
    }
}

// Show multiplayer lobby
function showMultiplayerLobby() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('multiplayerLobby').style.display = 'flex';
    document.getElementById('lobbyRoomCode').textContent = multiplayer.roomCode;
    
    if (multiplayer.isHost) {
        document.getElementById('startGameButton').style.display = 'block';
    } else {
        document.getElementById('startGameButton').style.display = 'none';
    }
}

// Update player list in lobby
function updatePlayerList(players) {
    const list = document.getElementById('lobbyPlayerList');
    list.innerHTML = players.map(p => 
        `<div class="lobby-player ${p.id === multiplayer.playerId ? 'you' : ''}">
            ${p.name} ${p.isHost ? '(Host)' : ''} ${p.id === multiplayer.playerId ? '(You)' : ''}
        </div>`
    ).join('');
}

// Start multiplayer game
function startMultiplayerGame(difficulty) {
    document.getElementById('multiplayerLobby').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'flex';
    document.getElementById('multiplayerUI').style.display = 'block';
    
    game.difficulty = difficulty;
    const modifier = DIFFICULTY_MODIFIERS[difficulty];
    document.getElementById('difficultyDisplay').textContent = modifier.displayName;
    
    // Reset player stats for new game
    game.player.health = modifier.oneHPMode ? 1 : 100;
    game.player.maxHealth = modifier.oneHPMode ? 1 : 100;
    game.player.level = 1;
    game.player.score = 0;
    game.player.money = 0;
    game.player.hasKey = false;
    game.player.weapons = [{ ...weaponTypes.melee }, { ...weaponTypes.pistol }];
    game.player.currentWeaponIndex = 1;
    game.player.speed = 5;
    game.player.gear = {
        helmet: null,
        vest: null,
        gloves: null,
        bag: null,
        shoes: null,
        ammoType: null
    };
    
    generateDungeon();
    updateUI();
    game.paused = false;
}

// Send player update to server
function sendPlayerUpdate() {
    if (!multiplayer.enabled || !multiplayer.ws || multiplayer.ws.readyState !== WebSocket.OPEN) {
        return;
    }

    const now = Date.now();
    if (now - multiplayer.lastUpdateSent < multiplayer.updateInterval) {
        return;
    }

    multiplayer.lastUpdateSent = now;

    multiplayer.ws.send(JSON.stringify({
        type: 'player_update',
        playerId: multiplayer.playerId,
        x: game.player.x,
        y: game.player.y,
        angle: game.player.angle,
        health: game.player.health,
        currentWeapon: game.player.weapons[game.player.currentWeaponIndex]?.name
    }));
}

// Send shoot event
function sendShootEvent(bullet) {
    if (!multiplayer.enabled || !multiplayer.ws || multiplayer.ws.readyState !== WebSocket.OPEN) {
        return;
    }

    multiplayer.ws.send(JSON.stringify({
        type: 'player_shoot',
        playerId: multiplayer.playerId,
        bullet: {
            x: bullet.x,
            y: bullet.y,
            vx: bullet.vx,
            vy: bullet.vy,
            damage: bullet.damage,
            color: bullet.color,
            size: bullet.size
        }
    }));
}

// Update other player's position
function updateOtherPlayer(data) {
    multiplayer.players.set(data.playerId, {
        x: data.x,
        y: data.y,
        angle: data.angle,
        health: data.health,
        currentWeapon: data.currentWeapon,
        lastUpdate: Date.now()
    });
}

// Handle other player shooting
function handleOtherPlayerShot(data) {
    const bullet = data.bullet;
    game.bullets.push({
        x: bullet.x,
        y: bullet.y,
        vx: bullet.vx,
        vy: bullet.vy,
        damage: bullet.damage,
        color: bullet.color || '#888',
        size: bullet.size || 4,
        isOtherPlayer: true
    });
}

// Sync enemies (for non-host players)
function syncEnemies(enemies) {
    // Only update if we're not the host
    if (multiplayer.isHost) return;
    
    game.enemies = enemies;
}

// Send enemy updates (host only)
function sendEnemyUpdate() {
    if (!multiplayer.enabled || !multiplayer.isHost || !multiplayer.ws || multiplayer.ws.readyState !== WebSocket.OPEN) {
        return;
    }

    multiplayer.ws.send(JSON.stringify({
        type: 'enemy_update',
        playerId: multiplayer.playerId,
        enemies: game.enemies.map(e => ({
            x: e.x,
            y: e.y,
            health: e.health,
            type: e.type,
            size: e.size,
            color: e.color
        }))
    }));
}

// Remove picked item
function removePickedItem(itemId) {
    game.items = game.items.filter((item, index) => index !== itemId);
}

// Add chat message
function addChatMessage(playerName, message) {
    const chatBox = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    messageEl.innerHTML = `<strong>${playerName}:</strong> ${message}`;
    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Send chat message
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message && multiplayer.enabled && multiplayer.ws && multiplayer.ws.readyState === WebSocket.OPEN) {
        multiplayer.ws.send(JSON.stringify({
            type: 'chat_message',
            playerId: multiplayer.playerId,
            message: message
        }));
        
        addChatMessage(multiplayer.playerName, message);
        input.value = '';
    }
}

// Leave multiplayer game
function leaveMultiplayer() {
    if (multiplayer.ws) {
        multiplayer.ws.close();
    }
    
    multiplayer.enabled = false;
    multiplayer.roomCode = null;
    multiplayer.playerId = null;
    multiplayer.isHost = false;
    multiplayer.players.clear();
    
    document.getElementById('multiplayerLobby').style.display = 'none';
    document.getElementById('multiplayerUI').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    showMainMenu();
}

// Heartbeat to keep connection alive
setInterval(() => {
    if (multiplayer.enabled && multiplayer.ws && multiplayer.ws.readyState === WebSocket.OPEN) {
        multiplayer.ws.send(JSON.stringify({ type: 'ping' }));
    }
}, 30000); // Every 30 seconds
