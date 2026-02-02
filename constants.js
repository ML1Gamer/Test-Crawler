// Game constants
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;
const DOOR_SIZE = 80;
const GRID_SIZE = 5;

// Enemy types
const ENEMY_TYPES = {
    CHASER: 'chaser',
    WANDERER: 'wanderer',
    SHOOTER: 'shooter',
    BOSS: 'boss',
    // New enemy types
    DASHER: 'dasher',
    NECROMANCER: 'necromancer',
    SUMMONED: 'summoned' // Enemies summoned by necromancer
};

// Room types
const ROOM_TYPES = {
    NORMAL: 'normal',
    START: 'start',
    BOSS: 'boss',
    TREASURE: 'treasure',
    KEY: 'key',
    SHOP: 'shop',
    GUN: 'gun',
    MINIBOSS: 'miniboss' // New mini-boss room type
};

// Mini-boss types
const MINIBOSS_TYPES = {
    DASHER: 'dasher',
    NECROMANCER: 'necromancer'
};
