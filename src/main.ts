import { Game } from './core/Game'
import './style.css'

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const game = new Game()
    await game.start()

    // Add pause/resume functionality
    window.addEventListener('blur', () => game.pause())
    window.addEventListener('focus', () => game.resume());

    // Expose game to window for debugging
    (window as any).game = game
  }
  catch (error) {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #ff6b6b;">
        <h1>🚫 Game Failed to Load</h1>
        <p>Check the console for error details.</p>
        <p>Error: ${error}</p>
      </div>
    `
  }
})
