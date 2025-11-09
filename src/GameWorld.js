// -----------------------------------------------------------------
// --- GameWorld.js
// -----------------------------------------------------------------

import * as THREE from 'three';
import { Config } from './Config.js';

export class GameWorld {
    constructor(scene, assets) {
        this.scene = scene;
        this.assets = assets;
        this.floorTiles = [];
        this.zombie = null;
        this.zombieMixer = null;

        this.createFloor();
        this.setupBackground();
        this.createZombie(this.assets.zombieModel);
    }

    reset() {
        console.log("Reseteando el mundo (piso)...");

        if (this.floorTiles) {
            this.floorTiles.forEach((tile, i) => {
                tile.position.z = -100 * i;
            });
        }

        if (this.zombie) {
            this.zombie.position.x = 0; // Resetea al carril central
            this.zombie.position.z = 11;
        }
    }

    setupBackground() {
        this.scene.background = null;
        this.scene.environment = null;
    }

    createFloor() {
        const texture = this.createFloorTexture();
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 30);

        const material = new THREE.MeshPhongMaterial({ 
            map: texture,
            shininess: 50,
            specular: 0x666666,
            side: THREE.DoubleSide
        });
        
        const geometry = new THREE.PlaneGeometry(Config.LANE_WIDTH * 3 + 4, 200);
        
        for (let i = 0; i < 2; i++) {
            const floor = new THREE.Mesh(geometry, material);
            floor.rotation.x = -Math.PI / 2;
            floor.position.z = -100 * i;
            floor.receiveShadow = true;
            this.scene.add(floor);
            this.floorTiles.push(floor);
        }
    }
    
    createFloorTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const context = canvas.getContext('2d');
        
        context.fillStyle = '#666666';
        context.fillRect(0, 0, 256, 256);
        
        context.strokeStyle = '#ffffff';
        context.lineWidth = 4;
        context.setLineDash([15, 20]);
        
        context.beginPath();
        context.moveTo(128, 0);
        context.lineTo(128, 256);
        context.stroke();
        
        context.strokeStyle = '#dddddd';
        context.lineWidth = 3;
        context.setLineDash([]);
        
        context.beginPath();
        context.moveTo(64, 0);
        context.lineTo(64, 256);
        context.stroke();
        
        context.beginPath();
        context.moveTo(192, 0);
        context.lineTo(192, 256);
        context.stroke();
        
        context.strokeStyle = '#222222';
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, 256);
        context.moveTo(256, 0);
        context.lineTo(256, 256);
        context.stroke();

        return new THREE.CanvasTexture(canvas);
    }

    // 1. Esta se llama cuando el juego CORRE
    update(deltaTime, speed, playerPosition) {
        // Mover el piso
        this.floorTiles.forEach(tile => {
            tile.position.z += speed * deltaTime;
            if (tile.position.z > 100) {
                tile.position.z -= 200;
            }
        });

        // Actualizar el zombi (animación y carril X)
        this.updateZombie(deltaTime, playerPosition);
    }

    // 2. Esta actualiza la animación y el carril X del zombi
    updateZombie(deltaTime, playerPosition) {
        if (this.zombie) {
            if (this.zombieMixer) {
                this.zombieMixer.update(deltaTime);
            }

            // Mover al zombi suavemente al carril del jugador
            // (Usamos un 'fallback' por si playerPosition es undefined)
            const targetX = playerPosition ? playerPosition.x : 0;
            this.zombie.position.x = THREE.MathUtils.lerp(this.zombie.position.x, targetX, 2 * deltaTime);
        }
    }

    // 3. Esta se llama cuando es GAME OVER
    zombieCatch(deltaTime) {
        if (this.zombie) {
            // Sigue actualizando la animación de caminar
            if (this.zombieMixer) {
                this.zombieMixer.update(deltaTime);
            }

            // Mueve al zombi hacia adelante (Z) para "atrapar" al jugador
            // El jugador está en Z=0, el zombi empieza en Z=11.
            const catchPositionZ = 1; 
            if (this.zombie.position.z > catchPositionZ) {
                // Ajusta el '2' para que sea más rápido o más lento
                this.zombie.position.z -= 2 * deltaTime; 
            }
        }
    }

    createZombie(zombieModel) {
        if (!zombieModel) {
            console.error("No se pasó modelo de zombi");
            return;
        }

        this.zombie = zombieModel;

        // Posición: Detrás del jugador (Z=0) y visible para la cámara (Z=11)
        this.zombie.position.set(0, 0, 11); 

        // Girarlo 180 grados para que mire hacia adelante
        this.zombie.rotation.y = Math.PI; 

        this.scene.add(this.zombie);

        // Configurar la animación
        if (this.zombie.animations && this.zombie.animations.length > 0) {
            this.zombieMixer = new THREE.AnimationMixer(this.zombie);
            const walkAction = this.zombieMixer.clipAction(this.zombie.animations[0]);
            walkAction.setLoop(THREE.LoopRepeat); // Queremos que camine en bucle
            walkAction.play();
        } else {
            console.warn("El modelo del zombi no contiene animaciones.");
        }
    }
}