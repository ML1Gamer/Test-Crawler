// Item pickup and shop functionality
function pickupNearbyItems() {
    for (let i = game.items.length - 1; i >= 0; i--) {
        const item = game.items[i];
        const dist = Math.hypot(item.x - game.player.x, item.y - game.player.y);
        
        if (dist < 50) {
            // Auto-pickup for consumables only
            if (item.type === 'powerup') {
                if (item.data === 'health') {
                    game.player.health = Math.min(game.player.maxHealth, game.player.health + 30);
                    createParticles(item.x, item.y, '#e94560', 10);
                    playPickupSound('health');
                }
                game.items.splice(i, 1);
            } else if (item.type === 'money') {
                game.player.money += item.amount;
                createParticles(item.x, item.y, '#ffd700', 10);
                playPickupSound('money');
                game.items.splice(i, 1);
            } else if (item.type === 'ammo') {
                let weaponToRefill = null;
                const currentWeapon = game.player.weapons[game.player.currentWeaponIndex];
                
                if (currentWeapon && !currentWeapon.isMelee && currentWeapon.ammo !== Infinity && currentWeapon.canRefill !== false) {
                    weaponToRefill = currentWeapon;
                } else {
                    const guns = game.player.weapons.filter(w => !w.isMelee && w.ammo !== Infinity && w.canRefill !== false);
                    if (guns.length > 0) {
                        weaponToRefill = guns[Math.floor(Math.random() * guns.length)];
                    }
                }
                
                if (weaponToRefill) {
                    const stats = getPlayerStats();
                    weaponToRefill.ammo += Math.floor(item.amount * stats.ammoMult);
                    createParticles(item.x, item.y, '#ffa500', 15);
                    playPickupSound('ammo');
                } else {
                    createParticles(item.x, item.y, '#666', 10);
                }
                game.items.splice(i, 1);
            }
            
            updateUI();
        }
    }
}

function manualPickup() {
    for (let i = game.items.length - 1; i >= 0; i--) {
        const item = game.items[i];
        const dist = Math.hypot(item.x - game.player.x, item.y - game.player.y);
        
        if (dist < 50) {
            if (item.type === 'key') {
                game.player.hasKey = true;
                createParticles(item.x, item.y, '#ffd700', 20);
                playPickupSound('key');
                game.items.splice(i, 1);
            } else if (item.type === 'miniboss_pedestal') {
                // Summon mini-boss!
                spawnMiniBoss(item.miniBossType);
                game.items.splice(i, 1);
                createParticles(item.x, item.y, '#ff00ff', 30);
                playExplosionSound();
            } else if (item.type === 'next_floor') {
                nextFloor();
                return;
            } else if (item.type === 'shop') {
                openShop();
            } else if (item.type === 'gun_box') {
                if (game.player.weapons.length >= 3) {
                    createParticles(item.x, item.y, '#e94560', 10);
                    continue;
                }
                
                const newWeapon = getRandomWeapon(true);
                const existing = game.player.weapons.find(w => w.name === newWeapon.name);
                if (!existing) {
                    game.player.weapons.push(newWeapon);
                }
                createParticles(item.x, item.y, '#4ecca3', 20);
                playPickupSound('weapon');
                game.items.splice(i, 1);
            } else if (item.type === 'weapon') {
                if (game.player.weapons.length >= 3) {
                    createParticles(item.x, item.y, '#e94560', 10);
                    continue;
                }
                
                const existing = game.player.weapons.find(w => w.name === item.data.name);
                if (!existing) {
                    game.player.weapons.push(item.data);
                }
                createParticles(item.x, item.y, '#4ecca3', 10);
                playPickupSound('weapon');
                game.items.splice(i, 1);
            } else if (item.type === 'gear') {
                // Swap gear
                const gearSlot = item.data.type;
                const oldGear = game.player.gear[gearSlot];
                
                if (oldGear) {
                    // Drop old gear
                    game.items.push({
                        x: item.x,
                        y: item.y,
                        type: 'gear',
                        data: oldGear,
                        size: 18
                    });
                }
                
                game.player.gear[gearSlot] = item.data;
                createParticles(item.x, item.y, '#ffd700', 15);
                playPickupSound('gear');
                game.items.splice(i, 1);
            }
            
            updateUI();
        }
    }
}

function nextFloor() {
    game.player.level++;
    game.player.maxHealth += 20;
    game.player.health = game.player.maxHealth;
    game.player.hasKey = false;
    generateDungeon();
    updateUI();
}

function openShop() {
    game.shopOpen = true;
    document.getElementById('overlay').classList.add('active');
    document.getElementById('shopMenu').classList.add('active');
    
    const shopItems = [
        { name: 'Gun Box', price: 50, type: 'gun_box' },
        { name: 'Ammo Pack (50 rounds)', price: 25, type: 'ammo' },
        { name: 'Health Pack', price: 30, type: 'health' },
        { name: 'Random Gear Box', price: 250, type: 'gear_box' }
    ];
    
    const shopHTML = shopItems.map(item => {
        const canAfford = game.player.money >= item.price;
        return `<div class="shop-item ${!canAfford ? 'disabled' : ''}" onclick="${canAfford ? `buyItem('${item.type}', ${item.price})` : ''}">
            <strong>${item.name}</strong> - 💰${item.price}
            ${!canAfford ? '<br><span style="color: #e94560;">Not enough money!</span>' : ''}
        </div>`;
    }).join('');
    
    document.getElementById('shopItems').innerHTML = shopHTML;
}

function closeShop() {
    game.shopOpen = false;
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('shopMenu').classList.remove('active');
}

function buyItem(type, price) {
    if (game.player.money < price) return;
    
    if (type === 'gun_box') {
        if (game.player.weapons.length >= 3) {
            createParticles(game.player.x, game.player.y, '#e94560', 15);
            return;
        }
        
        game.player.money -= price;
        const newWeapon = getRandomWeapon(true);
        const existing = game.player.weapons.find(w => w.name === newWeapon.name);
        if (!existing) {
            game.player.weapons.push(newWeapon);
        }
        createParticles(game.player.x, game.player.y, '#4ecca3', 15);
    } else if (type === 'ammo') {
        game.player.money -= price;
        let weaponToRefill = null;
        const currentWeapon = game.player.weapons[game.player.currentWeaponIndex];
        
        if (currentWeapon && !currentWeapon.isMelee && currentWeapon.ammo !== Infinity && currentWeapon.canRefill !== false) {
            weaponToRefill = currentWeapon;
        } else {
            const guns = game.player.weapons.filter(w => !w.isMelee && w.ammo !== Infinity && w.canRefill !== false);
            if (guns.length > 0) {
                weaponToRefill = guns[Math.floor(Math.random() * guns.length)];
            }
        }
        
        if (weaponToRefill) {
            weaponToRefill.ammo += 50;
            createParticles(game.player.x, game.player.y, '#ffa500', 20);
        } else {
            game.player.money += price;
            createParticles(game.player.x, game.player.y, '#e94560', 10);
        }
    } else if (type === 'health') {
        game.player.money -= price;
        game.player.health = Math.min(game.player.maxHealth, game.player.health + 50);
        createParticles(game.player.x, game.player.y, '#e94560', 15);
    } else if (type === 'gear_box') {
        game.player.money -= price;
        // Random gear type
        const gearSlots = ['helmet', 'vest', 'gloves', 'bag', 'shoes', 'ammoType'];
        const randomSlot = gearSlots[Math.floor(Math.random() * gearSlots.length)];
        const newGear = getRandomGear(randomSlot);
        
        game.items.push({
            x: game.player.x + Math.cos(game.player.angle) * 60,
            y: game.player.y + Math.sin(game.player.angle) * 60,
            type: 'gear',
            data: newGear,
            size: 18
        });
        createParticles(game.player.x, game.player.y, '#ffd700', 20);
    }
    
    updateUI();
    openShop();
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color,
            life: 30,
            size: Math.random() * 4 + 2
        });
    }
}
