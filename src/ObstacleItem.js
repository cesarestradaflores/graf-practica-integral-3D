// -----------------------------------------------------------------
// --- ObstacleItem.js (Clase base para Monedas y Obstáculos)
// -----------------------------------------------------------------

import * as THREE from 'three';

export class ObstacleItem {
    constructor(mesh, scene) {
        this.mesh = mesh;
        this.scene = scene;
        this.scene.add(this.mesh);

        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
    }

    updateBoundingBox() {
        this.boundingBox.setFromObject(this.mesh);
    }
    
    getBoundingBox() {
        return this.boundingBox;
    }

    removeFromScene() {
        this.scene.remove(this.mesh);
    }
}