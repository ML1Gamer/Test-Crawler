// Enemy spawning and AI
function spawnBoss(room) {
    // Add boss spawn indicator
    game.enemySpawnIndicators.push({
        x: ROOM_WIDTH / 2,
        y: 150,
        type: ENEMY_TYPES.BOSS,
        spawnTime: Date.now() + 2000, // Boss spawns after 2 seconds
        radius: 0,
        isBoss: true
    });
    
    // Lock doors immediately when boss spawn indicator appears
    game.doors.forEach(door => door.blocked = true);
    
    // Play boss music
    createMusicLoop('boss_spawn');
}

// Spawn mini-boss function
function spawnMiniBoss(type) {
    game.doors.forEach(door => door.blocked = true);
    createMusicLoop('boss_spawn');
    
    if (type === MINIBOSS_TYPES.DASHER) {
        const dasher = {
            x: ROOM_WIDTH / 2,
            y: 150,
            size: 30,
            health: 400 + game.player.level * 30,
            maxHealth: 400 + game.player.level * 30,
            speed: 2,
            color: '#ff4500',
            type: ENEMY_TYPES.DASHER,
            // Dasher-specific properties
            state: 'idle', // idle, windup, dashing
            windupTime: 0,
            dashDirection: { x: 0, y: 0 },
            dashSpeed: 15,
            windupDuration: 1000, // 1 second windup
            dashCooldown: 0,
            lastDash: 0
        };
        game.enemies.push(dasher);
        createParticles(dasher.x, dasher.y, '#ff4500', 30);
        playEnemySpawnSound();
    } else if (type === MINIBOSS_TYPES.NECROMANCER) {
        const necromancer = {
            x: ROOM_WIDTH / 2,
            y: 150,
            size: 28,
            health: 350 + game.player.level * 25,
            maxHealth: 350 + game.player.level * 25,
            speed: 1.2,
            color: '#800080',
            type: ENEMY_TYPES.NECROMANCER,
            // Necromancer-specific properties
            lastSummon: Date.now(),
            summonCooldown: 10000, // 10 seconds
            minions: [], // Track summoned minions
            healPerKill: 30
        };
        game.enemies.push(necromancer);
        createParticles(necromancer.x, necromancer.y, '#800080', 30);
        playEnemySpawnSound();
    }
}

function spawnEnemiesInRoom(room) {
    const numEnemies = Math.floor(Math.random() * 5) + 4;
    
    const spawnPoints = [
        { x: 100, y: 100 },
        { x: ROOM_WIDTH - 100, y: 100 },
        { x: 100, y: ROOM_HEIGHT - 100 },
        { x: ROOM_WIDTH - 100, y: ROOM_HEIGHT - 100 },
        { x: ROOM_WIDTH / 2, y: 100 },
        { x: ROOM_WIDTH / 2, y: ROOM_HEIGHT - 100 },
        { x: 100, y: ROOM_HEIGHT / 2 },
        { x: ROOM_WIDTH - 100, y: ROOM_HEIGHT / 2 }
    ];

    // Create spawn indicators
    for (let i = 0; i < numEnemies; i++) {
        const point = spawnPoints[i % spawnPoints.length];
        const spawnX = point.x + (Math.random() - 0.5) * 40;
        const spawnY = point.y + (Math.random() - 0.5) * 40;
        
        const rand = Math.random();
        let type;
        if (rand > 0.7) {
            type = ENEMY_TYPES.SHOOTER;
        } else if (rand > 0.4) {
            type = ENEMY_TYPES.WANDERER;
        } else {
            type = ENEMY_TYPES.CHASER;
        }
        
        // Add spawn indicator
        game.enemySpawnIndicators.push({
            x: spawnX,
            y: spawnY,
            type: type,
            spawnTime: Date.now() + 1500, // Spawn after 1.5 seconds
            radius: 0
        });
    }

    // Lock doors immediately when spawn indicators appear
    game.doors.forEach(door => door.blocked = true);
}

function spawnEnemy(x, y, type) {
    const enemy = {
        x: x,
        y: y,
        size: 18,
        health: 30 + game.player.level * 5,
        maxHealth: 30 + game.player.level * 5,
        speed: type === ENEMY_TYPES.SHOOTER ? 0.8 : (type === ENEMY_TYPES.WANDERER ? 1.2 : 1.0),
        color: type === ENEMY_TYPES.SHOOTER ? '#ff6b6b' : (type === ENEMY_TYPES.WANDERER ? '#4ecdc4' : '#95e1d3'),
        type: type,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
        lastShot: 0
    };
    game.enemies.push(enemy);
}

// Summoned enemy (for necromancer)
function spawnSummonedEnemy(x, y, type, necromancer) {
    const enemy = {
        x: x,
        y: y,
        size: 16,
        health: 20 + game.player.level * 3,
        maxHealth: 20 + game.player.level * 3,
        speed: type === ENEMY_TYPES.SHOOTER ? 0.8 : 1.0,
        color: type === ENEMY_TYPES.SHOOTER ? '#ff99cc' : '#cc99ff',
        type: ENEMY_TYPES.SUMMONED,
        actualType: type, // Store actual behavior type
        wanderAngle: Math.random() * Math.PI * 2,
        wanderTimer: 0,
        lastShot: 0,
        master: necromancer // Reference to necromancer
    };
    game.enemies.push(enemy);
    necromancer.minions.push(enemy);
    createParticles(x, y, enemy.color, 15);
    playEnemySpawnSound();
}

function handleEnemyDeath(enemy) {
    const index = game.enemies.indexOf(enemy);
    if (index > -1) {
        game.enemies.splice(index, 1);
        
        // If this was a summoned minion, heal the necromancer
        if (enemy.type === ENEMY_TYPES.SUMMONED && enemy.master) {
            enemy.master.health = Math.min(enemy.master.maxHealth, enemy.master.health + enemy.master.healPerKill);
            createParticles(enemy.master.x, enemy.master.y, '#00ff00', 20);
            
            // Remove from minions list
            const minionIndex = enemy.master.minions.indexOf(enemy);
            if (minionIndex > -1) {
                enemy.master.minions.splice(minionIndex, 1);
            }
        }
        
        // Play death sound
        playEnemyDeathSound(enemy.type === ENEMY_TYPES.BOSS || enemy.type === ENEMY_TYPES.DASHER || enemy.type === ENEMY_TYPES.NECROMANCER);
        
        // Mini-boss drops special loot
        if (enemy.type === ENEMY_TYPES.DASHER || enemy.type === ENEMY_TYPES.NECROMANCER) {
            game.player.score += 150;
            createParticles(enemy.x, enemy.y, enemy.color, 40);
            
            // Drop weapon
            const miniBossWeapon = getRandomWeapon(true);
            game.items.push({
                x: enemy.x - 80,
                y: enemy.y,
                type: 'weapon',
                data: miniBossWeapon,
                size: 15
            });
            
            // Drop money
            const moneyAmount = Math.floor(Math.random() * 150) + 150;
            game.items.push({
                x: enemy.x - 30,
                y: enemy.y,
                type: 'money',
                amount: moneyAmount,
                size: 10
            });
            
            // Drop ammo
            const ammoAmount = Math.floor(Math.random() * 75) + 75;
            game.items.push({
                x: enemy.x + 30,
                y: enemy.y,
                type: 'ammo',
                amount: ammoAmount,
                size: 12
            });
            
            // Drop health powerup
            game.items.push({
                x: enemy.x + 80,
                y: enemy.y,
                type: 'powerup',
                data: 'health',
                size: 15
            });
            
            // Drop random gear
            const gearSlots = ['helmet', 'vest', 'gloves', 'bag', 'shoes', 'ammoType'];
            const randomSlot = gearSlots[Math.floor(Math.random() * gearSlots.length)];
            const newGear = getRandomGear(randomSlot);
            game.items.push({
                x: enemy.x,
                y: enemy.y + 50,
                type: 'gear',
                data: newGear,
                size: 18
            });
        }
        // Boss drops special loot
        else if (enemy.type === ENEMY_TYPES.BOSS) {
            game.player.score += 100;
            createParticles(enemy.x, enemy.y, enemy.color, 30);
            
            // Drop weapon
            const bossWeapon = getRandomWeapon(true);
            game.items.push({
                x: enemy.x - 60,
                y: enemy.y,
                type: 'weapon',
                data: bossWeapon,
                size: 15
            });
            
            // Drop money
            const moneyAmount = Math.floor(Math.random() * 100) + 100;
            game.items.push({
                x: enemy.x - 20,
                y: enemy.y,
                type: 'money',
                amount: moneyAmount,
                size: 10
            });
            
            // Drop ammo
            const ammoAmount = Math.floor(Math.random() * 50) + 50;
            game.items.push({
                x: enemy.x + 20,
                y: enemy.y,
                type: 'ammo',
                amount: ammoAmount,
                size: 12
            });
            
            // Drop health powerup
            game.items.push({
                x: enemy.x + 60,
                y: enemy.y,
                type: 'powerup',
                data: 'health',
                size: 15
            });
        } else {
            game.player.score += 10;
            createParticles(enemy.x, enemy.y, enemy.color, 15);
            
            // Normal enemy drops
            if (Math.random() < 0.4) {
                const moneyAmount = Math.floor(Math.random() * 15) + 5;
                game.items.push({
                    x: enemy.x,
                    y: enemy.y,
                    type: 'money',
                    amount: moneyAmount,
                    size: 10
                });
            }
            
            if (Math.random() < 0.15) {
                const ammoAmount = Math.floor(Math.random() * 20) + 10;
                game.items.push({
                    x: enemy.x,
                    y: enemy.y,
                    type: 'ammo',
                    amount: ammoAmount,
                    size: 12
                });
            }
            
            if (Math.random() < 0.03) {
                const droppedWeapon = getRandomWeapon(true);
                game.items.push({
                    x: enemy.x,
                    y: enemy.y,
                    type: 'weapon',
                    data: droppedWeapon,
                    size: 15
                });
            }
        }
        
        if (game.enemies.length === 0) {
            game.currentRoom.cleared = true;
            game.doors.forEach(door => door.blocked = false);
        }
    }
}

function updateEnemySpawnIndicators() {
    const now = Date.now();
    
    for (let i = game.enemySpawnIndicators.length - 1; i >= 0; i--) {
        const indicator = game.enemySpawnIndicators[i];
        
        // Animate the growing circle
        const timeLeft = indicator.spawnTime - now;
        const totalTime = indicator.isBoss ? 2000 : 1500;
        const progress = 1 - (timeLeft / totalTime);
        indicator.radius = Math.max(0, progress * 30);
        
        // Check if it's time to spawn
        if (now >= indicator.spawnTime) {
            // Actually spawn the enemy
            if (indicator.isBoss) {
                const boss = {
                    x: indicator.x,
                    y: indicator.y,
                    size: 35,
                    health: 300 + game.player.level * 50,
                    maxHealth: 300 + game.player.level * 50,
                    speed: 1.5,
                    color: '#8b0000',
                    type: ENEMY_TYPES.BOSS,
                    wanderAngle: Math.random() * Math.PI * 2,
                    wanderTimer: 0,
                    lastShot: 0,
                    shotPattern: 0
                };
                game.enemies.push(boss);
            } else {
                spawnEnemy(indicator.x, indicator.y, indicator.type);
            }
            
            // Create spawn particles
            createParticles(indicator.x, indicator.y, '#e94560', 20);
            
            // Play spawn sound
            playEnemySpawnSound();
            
            // Remove the indicator
            game.enemySpawnIndicators.splice(i, 1);
        }
    }
}

// Update Dasher AI
function updateDasherAI(enemy) {
    const now = Date.now();
    const angleToPlayer = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
    
    // Calculate dash cooldown based on health (dash more frequently at low health)
    const healthPercent = enemy.health / enemy.maxHealth;
    const baseCooldown = 3000; // 3 seconds base
    const minCooldown = 1000; // 1 second minimum
    enemy.dashCooldown = baseCooldown - (baseCooldown - minCooldown) * (1 - healthPercent);
    
    if (enemy.state === 'idle') {
        // Move towards player slowly
        enemy.x += Math.cos(angleToPlayer) * enemy.speed;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed;
        
        // Start windup if cooldown expired
        if (now - enemy.lastDash > enemy.dashCooldown) {
            enemy.state = 'windup';
            enemy.windupTime = now;
            enemy.dashDirection = {
                x: Math.cos(angleToPlayer),
                y: Math.sin(angleToPlayer)
            };
        }
    } else if (enemy.state === 'windup') {
        // Windup phase - show red highlight (handled in rendering)
        const windupProgress = (now - enemy.windupTime) / enemy.windupDuration;
        
        if (windupProgress >= 1) {
            // Start dashing
            enemy.state = 'dashing';
            enemy.dashStartX = enemy.x;
            enemy.dashStartY = enemy.y;
        }
    } else if (enemy.state === 'dashing') {
        // Dash in the locked direction
        const newX = enemy.x + enemy.dashDirection.x * enemy.dashSpeed;
        const newY = enemy.y + enemy.dashDirection.y * enemy.dashSpeed;
        
        // Check for wall collision
        if (checkWallCollision(newX, newY, enemy.size) || checkEnemyDoorCollision(newX, newY, enemy.size)) {
            // Hit wall! Shoot projectiles
            enemy.state = 'idle';
            enemy.lastDash = now;
            
            // Shoot 5 random projectiles away from the wall
            for (let i = 0; i < 5; i++) {
                const randomAngle = Math.random() * Math.PI * 2;
                const bulletSpeed = 6;
                game.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(randomAngle) * bulletSpeed,
                    vy: Math.sin(randomAngle) * bulletSpeed,
                    color: '#ff4500',
                    size: 6
                });
            }
            playExplosionSound();
            createParticles(enemy.x, enemy.y, '#ff4500', 25);
        } else {
            enemy.x = newX;
            enemy.y = newY;
        }
    }
}

// Update Necromancer AI
function updateNecromancerAI(enemy) {
    const now = Date.now();
    const distToPlayer = Math.hypot(game.player.x - enemy.x, game.player.y - enemy.y);
    const angleToPlayer = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
    
    // Keep distance from player
    if (distToPlayer < 200) {
        enemy.x -= Math.cos(angleToPlayer) * enemy.speed;
        enemy.y -= Math.sin(angleToPlayer) * enemy.speed;
    } else if (distToPlayer > 350) {
        enemy.x += Math.cos(angleToPlayer) * enemy.speed * 0.5;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed * 0.5;
    }
    
    // Summon minions every 10 seconds
    if (now - enemy.lastSummon > enemy.summonCooldown && enemy.minions.length < 4) {
        enemy.lastSummon = now;
        
        // Summon 2 enemies
        for (let i = 0; i < 2; i++) {
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDist = 50;
            const spawnX = enemy.x + Math.cos(spawnAngle) * spawnDist;
            const spawnY = enemy.y + Math.sin(spawnAngle) * spawnDist;
            
            const summonType = Math.random() > 0.5 ? ENEMY_TYPES.SHOOTER : ENEMY_TYPES.CHASER;
            spawnSummonedEnemy(spawnX, spawnY, summonType, enemy);
        }
    }
}
