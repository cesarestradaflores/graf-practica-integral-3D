// -----------------------------------------------------------------
// --- Config.js (Archivo de Configuración Global) - POWER-UPS 15s
// -----------------------------------------------------------------

export const Config = {
    LANE_WIDTH: 4,        // Ancho de cada carril

    PLAYER_START_Z: 0,    // Posición Z inicial del jugador
    CAMERA_START_Y: 6,    // Altura de la cámara
    CAMERA_START_Z: 15,
    
    // Configuración de cámara
    CAMERA_FOV: 75,
    CAMERA_ASPECT: window.innerWidth / window.innerHeight,
    CAMERA_NEAR: 0.1,
    CAMERA_FAR: 1000,
    
    GAME_START_SPEED: 12,
    GAME_MAX_SPEED: 40,
    GAME_SPEED_INCREASE: 0.2,

    // Sistema de dificultad
    DIFFICULTY_INTERVAL: 1000,
    SPAWN_RATE_INCREASE: 0.3,

    JUMP_STRENGTH: 25,
    GRAVITY: -70,
    ROLL_DURATION: 0.7,
    
    // Constantes de estado del jugador
    PLAYER_STATE: {
        RUNNING: 'running',
        JUMPING: 'jumping',
        ROLLING: 'rolling',
        DEAD: 'dead'
    },

    // Constantes de tipo de obstáculo 
    OBSTACLE_TYPE: {
        BARRIER: 'barrier',
        WALL: 'wall',
        ROCK: 'rock',
        BARREL: 'barrel', 
        COIN: 'coin'
    },

    // Tipos de Power-ups
    POWERUP_TYPE: {
        MAGNET: 'magnet',    // Imán - Atrae monedas
        DOUBLE: 'double'     // Doble - Puntuación doble
    },

    // Power-ups duran 15 segundos
    POWERUP_DURATION: {
        magnet: 15.0,    // 15 segundos de imán
        double: 15.0     // 15 segundos de doble puntuación
    },

    POWERUP_SPAWN_CHANCE: 0.08, // 8% de chance de aparecer en cada spawn

    // Distancia de renderizado y niebla
    FOG_COLOR: 0x87CEEB,
    FOG_NEAR: 10,
    FOG_FAR: 300,

    // Posiciones Z
    SPAWN_Z: -150,
    DESPAWN_Z: 20,
};