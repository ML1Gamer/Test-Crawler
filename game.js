// Input handling
document.addEventListener('keydown', (e) => {
    game.keys[e.key.toLowerCase()] = true;
    
    if (e.key >= '1' && e.key <= '3') {
        const index = parseInt(e.key) - 1;
        if (index < game.player.weapons.length) {
            const weapon = game.player.weapons[index];
            if (weapon && (weapon.ammo === Infinity || weapon.ammo > 0 || weapon.isMelee)) {
                game.player.currentWeaponIndex = index;
                updateUI();
            }
        }
    }

    if (e.key.toLowerCase() === 'e') {
        manualPickup();
        tryEnterDoor();
    }

    if (e.key.toLowerCase() === 'q') {
        dropCurrentWeapon();
    }

    if (e.key === 'Escape' && game.shopOpen) {
        closeShop();
    }
});

document.addEventListener('keyup', (e) => {
    game.keys[e.key.toLowerCase()] = false;
});

let mouseDown = false;

document.addEventListener('mouseup', () => {
    mouseDown = false;
});

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.w &&
           rect1.x + rect1.w > rect2.x &&
           rect1.y < rect2.y + rect2.h &&
           rect1.h + rect1.y > rect2.y;
}

function checkWallCollision(x, y, size) {
    const playerRect = { x: x - size/2, y: y - size/2, w: size, h: size };
    return game.walls.some(wall => checkCollision(playerRect, wall));
}

function checkEnemyDoorCollision(x, y, size) {
    const enemyRect = { x: x - size/2, y: y - size/2, w: size, h: size };
    return game.doors.some(door => checkCollision(enemyRect, door));
}

function checkDoorCollision(x, y, size) {
    const playerRect = { x: x - size/2, y: y - size/2, w: size, h: size };
    
    for (const door of game.doors) {
        // Create a smaller hitbox for the door collision (50% of original size, centered)
        const shrinkAmount = 0.15; // 25% off each side = 50% total size
        const smallerDoor = {
            x: door.x + (door.w * shrinkAmount),
            y: door.y + (door.h * shrinkAmount),
            w: door.w * (1 - shrinkAmount * 2),
            h: door.h * (1 - shrinkAmount * 2)
        };
        
        // Larger detection area for entering doors (150% of original size)
        const expandAmount = 0.30; // Expand by 25% on each side
        const largerDoor = {
            x: door.x - (door.w * expandAmount),
            y: door.y - (door.h * expandAmount),
            w: door.w * (1 + expandAmount * 2),
            h: door.h * (1 + expandAmount * 2)
        };
        
        // Check if player is in the larger detection area
        if (checkCollision(playerRect, largerDoor)) {
            if (!door.blocked && !game.transitioning) {
                game.nearDoor = door;
            }
        }
        
        // Check collision with smaller hitbox
        if (checkCollision(playerRect, smallerDoor)) {
            if (door.blocked) {
                return true;
            }
            // Doors are solid to prevent walking through
            return true;
        }
    }
    
    // Clear nearDoor if not in any detection area
    const isNearAnyDoor = game.doors.some(door => {
        const expandAmount = 0.25;
        const largerDoor = {
            x: door.x - (door.w * expandAmount),
            y: door.y - (door.h * expandAmount),
            w: door.w * (1 + expandAmount * 2),
            h: door.h * (1 + expandAmount * 2)
        };
        return checkCollision(playerRect, largerDoor) && !door.blocked;
    });
    
    if (!isNearAnyDoor) {
        game.nearDoor = null;
    }
    
    return false;
}

function tryEnterDoor() {
    if (game.nearDoor && !game.transitioning) {
        game.transitioning = true;
        playDoorSound();
        const directions = {
            'north': { dx: 0, dy: -1 },
            'south': { dx: 0, dy: 1 },
            'east': { dx: 1, dy: 0 },
            'west': { dx: -1, dy: 0 }
        };
        const dir = directions[game.nearDoor.direction];
        const newX = game.gridX + dir.dx;
        const newY = game.gridY + dir.dy;
        
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && game.rooms[newY][newX]) {
            game.gridX = newX;
            game.gridY = newY;
            game.currentRoom = game.rooms[newY][newX];
            enterRoom(game.currentRoom);
        }
        setTimeout(() => {
            game.transitioning = false;
        }, 100);
    }
}

// Main update loop
function update() {
    if (game.shopOpen) return;

    // Update enemy spawn indicators
    updateEnemySpawnIndicators();

    if (mouseDown) {
        shoot();
    }

    const stats = getPlayerStats();
    const playerSpeed = game.player.speed + stats.speedBonus;

    let newX = game.player.x;
    let newY = game.player.y;

    if (game.keys['w'] || game.keys['arrowup']) newY -= playerSpeed;
    if (game.keys['s'] || game.keys['arrowdown']) newY += playerSpeed;
    if (game.keys['a'] || game.keys['arrowleft']) newX -= playerSpeed;
    if (game.keys['d'] || game.keys['arrowright']) newX += playerSpeed;

    if (!checkWallCollision(newX, game.player.y, game.player.size) && 
        !checkDoorCollision(newX, game.player.y, game.player.size)) {
        game.player.x = newX;
    }
    if (!checkWallCollision(game.player.x, newY, game.player.size) && 
        !checkDoorCollision(game.player.x, newY, game.player.size)) {
        game.player.y = newY;
    }

    game.player.angle = Math.atan2(game.mouseY - game.player.y, game.mouseX - game.player.x);

    // Auto-pickup nearby items
    pickupNearbyItems();

    // Update bullets
    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const bullet = game.bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x < 0 || bullet.x > ROOM_WIDTH || bullet.y < 0 || bullet.y > ROOM_HEIGHT) {
            game.bullets.splice(i, 1);
            continue;
        }

        const bulletRect = { x: bullet.x - 2, y: bullet.y - 2, w: 4, h: 4 };
        if (game.walls.some(wall => checkCollision(bulletRect, wall))) {
            game.bullets.splice(i, 1);
            continue;
        }

        for (let j = game.enemies.length - 1; j >= 0; j--) {
            const enemy = game.enemies[j];
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            
            if (dist < enemy.size) {
                enemy.health -= bullet.damage;
                
                // Lifesteal
                if (bullet.lifesteal && bullet.lifesteal > 0) {
                    game.player.health = Math.min(game.player.maxHealth, game.player.health + bullet.damage * bullet.lifesteal);
                }
                
                createParticles(bullet.x, bullet.y, enemy.color, 5);
                playHitSound();
                
                if (bullet.explosive) {
                    playExplosionSound();
                    createParticles(bullet.x, bullet.y, '#ff8c00', 30);
                    game.enemies.forEach(e => {
                        const explosionDist = Math.hypot(bullet.x - e.x, bullet.y - e.y);
                        if (explosionDist < bullet.explosionRadius) {
                            e.health -= bullet.damage * (1 - explosionDist / bullet.explosionRadius);
                            createParticles(e.x, e.y, e.color, 8);
                        }
                    });
                }
                
                if (enemy.health <= 0) {
                    handleEnemyDeath(enemy);
                }
                
                if (!bullet.penetrating) {
                    game.bullets.splice(i, 1);
                }
                break;
            }
        }
    }

    // Update enemy bullets
    for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = game.enemyBullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x < 0 || bullet.x > ROOM_WIDTH || bullet.y < 0 || bullet.y > ROOM_HEIGHT) {
            game.enemyBullets.splice(i, 1);
            continue;
        }

        const bulletRect = { x: bullet.x - 2, y: bullet.y - 2, w: 4, h: 4 };
        if (game.walls.some(wall => checkCollision(bulletRect, wall))) {
            game.enemyBullets.splice(i, 1);
            continue;
        }

        const dist = Math.hypot(bullet.x - game.player.x, bullet.y - game.player.y);
        if (dist < game.player.size) {
            const stats = getPlayerStats();
            
            // Check for evasion
            if (stats.evasion > 0 && Math.random() < stats.evasion) {
                createParticles(bullet.x, bullet.y, '#4ecca3', 5);
                game.enemyBullets.splice(i, 1);
                continue;
            }
            
            const damage = Math.max(1, 5 - Math.floor(stats.defense * 0.1));
            game.player.health -= damage;
            createParticles(bullet.x, bullet.y, '#e94560', 5);
            playPlayerHurtSound();
            game.enemyBullets.splice(i, 1);
            
            if (game.player.health <= 0) {
                resetGame();
            }
        }
    }

    // Update enemies
    const now = Date.now();
    game.enemies.forEach(enemy => {
        const distToPlayer = Math.hypot(game.player.x - enemy.x, game.player.y - enemy.y);
        
        let moveX = 0;
        let moveY = 0;

        // Mini-boss AI
        if (enemy.type === ENEMY_TYPES.DASHER) {
            updateDasherAI(enemy);
            return; // Skip normal movement
        } else if (enemy.type === ENEMY_TYPES.NECROMANCER) {
            updateNecromancerAI(enemy);
            // Continue for wall collision checks
        } else if (enemy.type === ENEMY_TYPES.BOSS) {
            const angleToPlayer = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
            
            // Boss movement pattern
            if (distToPlayer < 250) {
                moveX = -Math.cos(angleToPlayer) * enemy.speed;
                moveY = -Math.sin(angleToPlayer) * enemy.speed;
            } else if (distToPlayer > 350) {
                moveX = Math.cos(angleToPlayer) * enemy.speed;
                moveY = Math.sin(angleToPlayer) * enemy.speed;
            }
            
            // Boss shooting pattern - shoots in bursts
            if (now - enemy.lastShot > 800) {
                enemy.lastShot = now;
                const bulletSpeed = 5;
                
                // Shoot 3 bullets in a spread
                for (let i = -1; i <= 1; i++) {
                    const angle = angleToPlayer + (i * 0.2);
                    game.enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angle) * bulletSpeed,
                        vy: Math.sin(angle) * bulletSpeed,
                        color: '#8b0000',
                        size: 7
                    });
                }
            }
        } else if (enemy.type === ENEMY_TYPES.SUMMONED) {
            // Summoned enemies behave like their actual type
            const angleToPlayer = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
            
            if (enemy.actualType === ENEMY_TYPES.CHASER) {
                const randomOffset = (Math.random() - 0.5) * 1.5;
                const angle = angleToPlayer + randomOffset;
                moveX = Math.cos(angle) * enemy.speed;
                moveY = Math.sin(angle) * enemy.speed;
            } else if (enemy.actualType === ENEMY_TYPES.SHOOTER) {
                if (distToPlayer < 200) {
                    moveX = -Math.cos(angleToPlayer) * enemy.speed;
                    moveY = -Math.sin(angleToPlayer) * enemy.speed;
                } else if (distToPlayer > 300) {
                    moveX = Math.cos(angleToPlayer) * enemy.speed;
                    moveY = Math.sin(angleToPlayer) * enemy.speed;
                }
                
                if (now - enemy.lastShot > 1500 && distToPlayer < 350) {
                    enemy.lastShot = now;
                    const bulletSpeed = 4;
                    game.enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angleToPlayer) * bulletSpeed,
                        vy: Math.sin(angleToPlayer) * bulletSpeed,
                        color: enemy.color,
                        size: 5
                    });
                }
            }
        } else if (enemy.type === ENEMY_TYPES.CHASER) {
            const angleToPlayer = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
            const randomOffset = (Math.random() - 0.5) * 1.5;
            const angle = angleToPlayer + randomOffset;
            moveX = Math.cos(angle) * enemy.speed;
            moveY = Math.sin(angle) * enemy.speed;
        } else if (enemy.type === ENEMY_TYPES.WANDERER) {
            const angleToPlayer = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
            enemy.wanderTimer++;
            if (enemy.wanderTimer > 60) {
                enemy.wanderAngle += (Math.random() - 0.5) * 0.5;
                enemy.wanderTimer = 0;
            }
            
            const orbitAngle = angleToPlayer + Math.PI / 2 + enemy.wanderAngle;
            
            if (distToPlayer < 100) {
                // Too close, move away while orbiting
                const retreatAngle = angleToPlayer + Math.PI + enemy.wanderAngle * 0.5;
                moveX = Math.cos(retreatAngle) * enemy.speed;
                moveY = Math.sin(retreatAngle) * enemy.speed;
            } else if (distToPlayer > 200) {
                // Too far, move closer while orbiting
                const approachAngle = angleToPlayer + enemy.wanderAngle * 0.3;
                moveX = Math.cos(approachAngle) * enemy.speed;
                moveY = Math.sin(approachAngle) * enemy.speed;
            } else {
                // Perfect range, orbit around player
                moveX = Math.cos(orbitAngle) * enemy.speed;
                moveY = Math.sin(orbitAngle) * enemy.speed;
            }
        } else if (enemy.type === ENEMY_TYPES.SHOOTER) {
            const angleToPlayer = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
            
            if (distToPlayer < 200) {
                moveX = -Math.cos(angleToPlayer) * enemy.speed;
                moveY = -Math.sin(angleToPlayer) * enemy.speed;
            } else if (distToPlayer > 300) {
                moveX = Math.cos(angleToPlayer) * enemy.speed;
                moveY = Math.sin(angleToPlayer) * enemy.speed;
            }
            
            if (now - enemy.lastShot > 1500 && distToPlayer < 350) {
                enemy.lastShot = now;
                const bulletSpeed = 4;
                game.enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angleToPlayer) * bulletSpeed,
                    vy: Math.sin(angleToPlayer) * bulletSpeed,
                    color: '#ff6b6b',
                    size: 5
                });
            }
        }

        // Apply movement with collision detection (skip for Dasher, it handles its own)
        if (enemy.type !== ENEMY_TYPES.DASHER) {
            const newX = enemy.x + moveX;
            const newY = enemy.y + moveY;
            
            if (!checkWallCollision(newX, enemy.y, enemy.size) && !checkEnemyDoorCollision(newX, enemy.y, enemy.size)) {
                enemy.x = newX;
            }
            if (!checkWallCollision(enemy.x, newY, enemy.size) && !checkEnemyDoorCollision(enemy.x, newY, enemy.size)) {
                enemy.y = newY;
            }
        }

        if (distToPlayer < game.player.size + enemy.size) {
            const stats = getPlayerStats();
            const contactDamage = Math.max(0.1, 0.2 - (stats.defense * 0.005));
            game.player.health -= contactDamage;
            if (game.player.health <= 0) {
                resetGame();
            }
        }
    });

    // Update particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) {
            game.particles.splice(i, 1);
        }
    }

    updateUI();
}

// Apply passive health regeneration
function applyHealthRegen() {
    const stats = getPlayerStats();
    if (stats.healthRegen > 0) {
        game.player.health = Math.min(game.player.maxHealth, game.player.health + stats.healthRegen * 0.1);
    }
}

// Game loop
function gameLoop() {
    update();
    applyHealthRegen();
    draw();
    requestAnimationFrame(gameLoop);
}

// Get mouse coordinates accounting for canvas scaling
function getScaledMouseCoordinates(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = ROOM_WIDTH / rect.width;
    const scaleY = ROOM_HEIGHT / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
}

// Initialize and start the game when DOM is ready
function initGame() {
    // Initialize canvas references
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    minimapCanvas = document.getElementById('minimapCanvas');
    minimapCtx = minimapCanvas.getContext('2d');
    
    // Initialize audio system
    initAudio();
    
    // Setup volume controls
    document.getElementById('musicVolume').addEventListener('input', (e) => {
        setMusicVolume(e.target.value / 100);
    });
    
    document.getElementById('sfxVolume').addEventListener('input', (e) => {
        setSFXVolume(e.target.value / 100);
    });
    
    // Setup canvas event listeners with proper scaling
    canvas.addEventListener('mousemove', (e) => {
        const coords = getScaledMouseCoordinates(e, canvas);
        game.mouseX = coords.x;
        game.mouseY = coords.y;
    });

    canvas.addEventListener('mousedown', () => {
        mouseDown = true;
    });

    canvas.addEventListener('mouseup', () => {
        mouseDown = false;
    });
    
    // Start the game
    generateDungeon();
    updateUI();
    gameLoop();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
