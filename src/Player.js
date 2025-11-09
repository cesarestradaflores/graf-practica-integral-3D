// -----------------------------------------------------------------
// --- Player.js (VERSIÓN MEJORADA CON TRANSICIONES CORREGIDAS)
// -----------------------------------------------------------------

import * as THREE from 'three';
import { Config } from './Config.js';

export class Player {
    constructor(scene, assets) {
        this.scene = scene;
        this.assets = assets;
        this.height = 2.5; 
        this.width = 1;

        this.group = new THREE.Group();
        this.group.scale.set(0.015, 0.015, 0.015);
        this.scene.add(this.group);
        
        this.mesh = null; 
        this.mixer = null; 
        this.actions = {}; 
        this.activeActionName = ''; 

        this.boundingBox = new THREE.Box3();

        if (assets.playerModel) {
            this.mesh = assets.playerModel;
            this.mesh.position.y = 0; 
            
            this.group.add(this.mesh); 
            this.mesh.rotation.y = Math.PI;
            
            this.mixer = new THREE.AnimationMixer(this.mesh);

            this.actions['run'] = this.mixer.clipAction(assets.animRun.animations[0]);
            this.actions['jump'] = this.mixer.clipAction(assets.animJump.animations[0]);
            this.actions['die'] = this.mixer.clipAction(assets.animDie.animations[0]);
            this.actions['roll'] = this.mixer.clipAction(assets.animRoll.animations[0]);
            this.actions['left'] = this.mixer.clipAction(assets.animLeft.animations[0]);
            this.actions['right'] = this.mixer.clipAction(assets.animRight.animations[0]);
            
            // Configurar loops correctamente
            this.actions.run.setLoop(THREE.LoopRepeat);
            this.actions.jump.setLoop(THREE.LoopOnce);
            this.actions.die.setLoop(THREE.LoopOnce);
            this.actions.roll.setLoop(THREE.LoopOnce);
            this.actions.left.setLoop(THREE.LoopOnce);
            this.actions.right.setLoop(THREE.LoopOnce);
            
            this.actions.die.clampWhenFinished = true;
            this.actions.jump.clampWhenFinished = false;
            this.actions.roll.clampWhenFinished = false;

            this.activeActionName = 'run';
            this.actions.run.play();
            
            this._updateBoundingBox();
            
            // Listener para volver a 'run' después de animaciones cortas
            this.mixer.addEventListener('finished', (e) => {
            // Si la animación que terminó NO es la de morir
            // y el estado actual es RUNNING (no estamos saltando o rodando)
                if (e.action !== this.actions.die && this.state === Config.PLAYER_STATE.RUNNING) {
                    this.switchAnimation('run');
                }
            });
            
        } else {
            console.error("No se pasó ningún modelo de jugador. Creando placeholder.");
            this._createPlaceholder();
        }
        
        this.state = Config.PLAYER_STATE.RUNNING;
        this.currentLane = 1; 
        this.yVelocity = 0;
        this.rollTimer = 0;
    }

    // Sistema de transiciones de animación
    switchAnimation(newActionName) {
        if (this.activeActionName === newActionName) return; 

        const oldAction = this.actions[this.activeActionName];
        const newAction = this.actions[newActionName];

        // Configurar la nueva animación antes de la transición
        newAction.reset();
        
        // Configurar loop según el tipo de animación
        if (newActionName === 'run') {
            newAction.setLoop(THREE.LoopRepeat);
        } else {
            newAction.setLoop(THREE.LoopOnce);
        }
        
        newAction.clampWhenFinished = (newActionName === 'die');
        
        // Realizar transición suave
        oldAction.fadeOut(0.1);
        newAction.fadeIn(0.1);
        newAction.play();

        this.activeActionName = newActionName;
    }

    _createPlaceholder() {
        const geometry = new THREE.CapsuleGeometry(this.width / 2, this.height - this.width, 16);
        const material = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.group.add(this.mesh);
        this.group.position.y = this.height / 2;
        this._updateBoundingBox();
    }
    
    die() {
        this.state = Config.PLAYER_STATE.DEAD;
        this.switchAnimation('die');
    }

    onKeyDown(event) {
        if (this.state === Config.PLAYER_STATE.DEAD) return; 

        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
            case 'Space':
                this.jump();
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.strafe(-1);
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.strafe(1);
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.roll();
                break;
        }
    }

    reset() {
        console.log("Reseteando al jugador...");
        this.state = Config.PLAYER_STATE.RUNNING;
        this.yVelocity = 0;
        this.rollTimer = 0;
        this.currentLane = 1; 

        if (this.group) {
            this.group.scale.set(0.015, 0.015, 0.015);
            this.group.position.x = 0;
            this.group.position.y = 0;
            
            this._updateBoundingBox();
            
            if (this.mixer) {
                this.mixer.stopAllAction();
                this.activeActionName = 'run';
                this.actions.run.reset();
                this.actions.run.play();
            }
        }
    }

    strafe(direction) {
        // Solo bloquea si estamos muertos
        if (this.state === Config.PLAYER_STATE.DEAD) return; 

        // 1. Actualiza el carril objetivo SIEMPRE
        // (La función update() se encargará de mover el personaje suavemente)
        const targetLane = this.currentLane + direction;
        this.currentLane = THREE.MathUtils.clamp(targetLane, 0, 2);

        // 2. Reproduce la animación de strafe SÓLO SI ESTAMOS CORRIENDO
        if (this.state === Config.PLAYER_STATE.RUNNING) {
            if (direction === -1) {
                this.switchAnimation('left');
            } else {
                this.switchAnimation('right');
            }
        }
        // Si estamos saltando o rodando, no hace nada, lo cual mantiene la animación de salto/rodar
    }

    jump() {
        if (this.state === Config.PLAYER_STATE.RUNNING) {
            this.state = Config.PLAYER_STATE.JUMPING;
            this.yVelocity = Config.JUMP_STRENGTH;
            this.switchAnimation('jump'); 
        }
    }

    roll() {
        if (this.state === Config.PLAYER_STATE.RUNNING) {
            this.state = Config.PLAYER_STATE.ROLLING;
            this.rollTimer = Config.ROLL_DURATION;
            this.switchAnimation('roll');
        }
    }

    update(deltaTime) {
        if (!this.group) return; 
        
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        if (this.state === Config.PLAYER_STATE.DEAD) return; 

        const targetX = (this.currentLane - 1) * Config.LANE_WIDTH;
        this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, targetX, 10 * deltaTime);
        
        const groundY = 0;

        if (this.state === Config.PLAYER_STATE.JUMPING) {
            this.group.position.y += this.yVelocity * deltaTime;
            this.yVelocity += Config.GRAVITY * deltaTime;

            if (this.group.position.y <= groundY) {
                this.group.position.y = groundY;
                this.yVelocity = 0;
                this.state = Config.PLAYER_STATE.RUNNING;
                this.switchAnimation('run'); 
            }
        }

        if (this.state === Config.PLAYER_STATE.ROLLING) {
            this.rollTimer -= deltaTime;
            if (this.rollTimer <= 0) {
                this.state = Config.PLAYER_STATE.RUNNING;
                this.switchAnimation('run'); 
            }
        }
        
        this._updateBoundingBox();
    }

    _updateBoundingBox() {
        if (!this.group) return; 
        this.boundingBox.setFromObject(this.group, true);
        this.boundingBox.expandByScalar(0.1);
    }

    getBoundingBox() {
        return this.boundingBox;
    }
}