// -----------------------------------------------------------------
// --- main.js (Punto de Entrada)
// -----------------------------------------------------------------
import { Game } from './Game.js';

// Hacer la instancia del juego global para acceder desde los controles de audio
window.game = null;

document.addEventListener('DOMContentLoaded', () => {
    
    window.game = new Game();
    
    const startButton = document.getElementById('start-game-button');
    const restartButton = document.getElementById('restart-button');

    if (!startButton || !restartButton) {
        console.error("No se pudieron encontrar los botones de inicio o reinicio.");
        return;
    }

    startButton.addEventListener('click', () => {
        console.log("Botón de inicio presionado.");
        window.game.startGame();
    });

    restartButton.addEventListener('click', () => {
        console.log("Botón de reinicio presionado.");
        window.game.restartGame();
    });
    
    window.game.init().catch(err => {
        console.error("Error al inicializar el juego:", err);
        const loadingScreen = document.getElementById('loading-screen');
        const errorScreen = document.getElementById('error-screen');
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (errorScreen) errorScreen.style.display = 'flex';
    });

});