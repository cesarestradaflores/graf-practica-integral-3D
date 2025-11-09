// -----------------------------------------------------------------
// --- ObstacleManager.js - POWER-UPS
// -----------------------------------------------------------------

import * as THREE from 'three';
import { Config } from './Config.js';
import { ObstacleItem } from './ObstacleItem.js';

export class ObstacleManager {
    constructor(scene, assets) {
        this.scene = scene;
        this.assets = assets;
        this.obstacles = [];
        this.coins = [];
        this.powerUps = [];

        this.spawnTimer = 2;
        this.baseSpawnRate = 2;
        this.difficultyLevel = 1;
        
        console.log("✅ ObstacleManager inicializado - Power-ups tamaño ajustable");
    }
    
    spawnSet() {
        const lane = Math.floor(Math.random() * 3);
        const obstacleType = this.getRandomObstacleType();
        
        this.spawnObstacle(lane, obstacleType);
        
        // Generar power-up ocasionalmente
        if (Math.random() < Config.POWERUP_SPAWN_CHANCE) {
            const powerUpLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
            this.spawnPowerUp(powerUpLane);
        } else if (this.difficultyLevel >= 3 && Math.random() > 0.6) {
            const secondLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
            this.spawnObstacle(secondLane, this.getRandomObstacleType());
        }
        
        // MONEDAS - línea recta en un carril
        const coinLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
        for(let i = 0; i < 5; i++) {
            this.spawnCoin(coinLane, Config.SPAWN_Z - i * 3);
        }
    }

    getRandomObstacleType() {
        const rand = Math.random();
        if (rand < 0.33) {
            return Config.OBSTACLE_TYPE.BARRIER;
        } else if (rand < 0.66) {
            return Config.OBSTACLE_TYPE.WALL;
        } else {
            return Config.OBSTACLE_TYPE.BARREL;
        }
    }

    spawnObstacle(lane, type) {
        let model;
        let positionY = 0;
        let scale = 1;
        
        switch (type) {
            case Config.OBSTACLE_TYPE.BARRIER:
                model = this.assets.barrier.clone();
                positionY = 0;
                scale = 0.015;
                break;
                
            case Config.OBSTACLE_TYPE.WALL:
                model = this.assets.car.clone();
                positionY = 0.5;
                scale = 0.012;
                break;
                
            case Config.OBSTACLE_TYPE.BARREL: 
                model = this.assets.barrel.clone();
                positionY = 1.0;
                scale = 0.02;
                break;
                
            default:
                model = this.assets.barrier.clone();
                scale = 0.015;
        }

        model.scale.set(scale, scale, scale);

        const obstacle = new ObstacleItem(model, this.scene);
        obstacle.type = type;
        
        obstacle.mesh.position.x = (lane - 1) * Config.LANE_WIDTH;
        obstacle.mesh.position.y = positionY;
        obstacle.mesh.position.z = Config.SPAWN_Z;
        
        this.obstacles.push(obstacle);
    }

    spawnCoin(lane, zPos) {
        const coinModel = this.assets.coin.clone();
        const coin = new ObstacleItem(coinModel, this.scene);
        coin.type = Config.OBSTACLE_TYPE.COIN;
        
        coin.mesh.position.x = (lane - 1) * Config.LANE_WIDTH;
        coin.mesh.position.y = 1.5;
        coin.mesh.position.z = zPos;
        this.coins.push(coin);
    }

    spawnPowerUp(lane) {
        try {
            const powerUpType = Math.random() > 0.5 ? Config.POWERUP_TYPE.MAGNET : Config.POWERUP_TYPE.DOUBLE;
            
            let model;
            
            switch (powerUpType) {
                case Config.POWERUP_TYPE.MAGNET:
                    model = this.assets.dartboard.clone();
                    break;
                    
                case Config.POWERUP_TYPE.DOUBLE:
                    model = this.assets.pipeWrench.clone();
                    break;
                    
                default:
                    console.error("❌ Tipo de power-up desconocido:", powerUpType);
                    return;
            }

            model.castShadow = true;
            model.receiveShadow = true;

            const powerUp = new ObstacleItem(model, this.scene);
            powerUp.type = "POWERUP";
            powerUp.powerUpType = powerUpType;
            
            powerUp.mesh.position.x = (lane - 1) * Config.LANE_WIDTH;
            powerUp.mesh.position.y = 1.6; // Ajustar altura
            powerUp.mesh.position.z = Config.SPAWN_Z;
            
            // Animación flotante
            powerUp.originalY = powerUp.mesh.position.y;
            powerUp.floatTime = 0;
            
            this.powerUps.push(powerUp);
            
            console.log(`⚡ Power-up generado: ${powerUpType} - Escala: ${scale}`);
            
        } catch (error) {
            console.error("❌ Error al generar power-up:", error);
        }
    }

    update(deltaTime, speed, distance, playerPosition, activePowerUps) {
        this.updateDifficulty(distance);
        
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            this.spawnSet();
            this.spawnTimer = this.baseSpawnRate / (this.difficultyLevel * 0.7) + Math.random() * 0.8;
        }

        // Actualizar obstáculos
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.mesh.position.z += speed * deltaTime;
            obstacle.updateBoundingBox();

            if (obstacle.mesh.position.z > Config.DESPAWN_Z) {
                obstacle.removeFromScene();
                this.obstacles.splice(i, 1);
            }
        }

        // Actualizar monedas
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.mesh.position.z += speed * deltaTime;
            coin.mesh.rotation.z += 5 * deltaTime;
            coin.updateBoundingBox();
            
            // Efecto de imán si está activo
            if (activePowerUps.magnet && activePowerUps.magnet.active) {
                const distanceToPlayer = Math.sqrt(
                    Math.pow(coin.mesh.position.x - playerPosition.x, 2) +
                    Math.pow(coin.mesh.position.z - playerPosition.z, 2)
                );
                
                if (distanceToPlayer < 10.0) {
                    const directionX = playerPosition.x - coin.mesh.position.x;
                    const directionZ = playerPosition.z - coin.mesh.position.z;
                    
                    coin.mesh.position.x += directionX * deltaTime * 15;
                    coin.mesh.position.z += directionZ * deltaTime * 15;
                }
            }
            
            if (coin.mesh.position.z > Config.DESPAWN_Z) {
                coin.removeFromScene();
                this.coins.splice(i, 1);
            }
        }

        // Actualizar power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.mesh.position.z += speed * deltaTime;
            
            // Animación para power-ups
            powerUp.floatTime += deltaTime;

            // Rotación (Solo en Y)
            powerUp.mesh.rotation.y += deltaTime * 3; // Rota 3 rad/s

            // Efecto de brillo (se mantiene)
            if (powerUp.mesh.material) {
                const glowIntensity = (Math.sin(powerUp.floatTime * 10) + 1) * 0.3 + 0.4;
                if (powerUp.powerUpType === Config.POWERUP_TYPE.MAGNET) {
                    powerUp.mesh.material.emissive = new THREE.Color(0xFF0000).multiplyScalar(glowIntensity);
                } else {
                    powerUp.mesh.material.emissive = new THREE.Color(0xFFFF00).multiplyScalar(glowIntensity);
                }
            }
            
            powerUp.updateBoundingBox();
            
            if (powerUp.mesh.position.z > Config.DESPAWN_Z) {
                powerUp.removeFromScene();
                this.powerUps.splice(i, 1);
            }
        }
    }

    updateDifficulty(distance) {
        const newDifficulty = Math.floor(distance / Config.DIFFICULTY_INTERVAL) + 1;
        if (newDifficulty > this.difficultyLevel) {
            this.difficultyLevel = newDifficulty;
        }
    }

    reset() {
        console.log("🔄 Reseteando ObstacleManager...");

        // Limpiar obstáculos
        let obstaclesRemoved = 0;
        while (this.obstacles.length > 0) {
            const obstacle = this.obstacles.pop();
            if (obstacle && obstacle.mesh) {
                obstacle.removeFromScene();
                obstaclesRemoved++;
            }
        }

        // Limpiar monedas
        let coinsRemoved = 0;
        while (this.coins.length > 0) {
            const coin = this.coins.pop();
            if (coin && coin.mesh) {
                coin.removeFromScene();
                coinsRemoved++;
            }
        }

        // Limpiar power-ups
        let powerUpsRemoved = 0;
        while (this.powerUps.length > 0) {
            const powerUp = this.powerUps.pop();
            if (powerUp && powerUp.mesh) {
                powerUp.removeFromScene();
                powerUpsRemoved++;
            }
        }

        this.spawnTimer = 2;
        this.difficultyLevel = 1;
        
        console.log(`✅ ObstacleManager reiniciado`);
    } 
    
    collectCoin(coin) {
        if (!coin || !coin.mesh) {
            console.warn("⚠️ Intento de recolectar moneda inválida");
            return;
        }
        
        coin.removeFromScene(); 
        const index = this.coins.indexOf(coin);
        if (index > -1) {
            this.coins.splice(index, 1);
        }
    }

    collectPowerUp(powerUp) {
        if (!powerUp || !powerUp.mesh) {
            console.error("❌ Power-up inválido en collectPowerUp");
            return null;
        }
        
        if (!powerUp.powerUpType) {
            console.error("❌ Power-up sin tipo definido:", powerUp);
            return null;
        }
        
        // Remover de la escena
        powerUp.removeFromScene(); 
        
        // Remover del array
        const index = this.powerUps.indexOf(powerUp);
        if (index > -1) {
            this.powerUps.splice(index, 1);
        }
        
        return powerUp.powerUpType;
    }
}