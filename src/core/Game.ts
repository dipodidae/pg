import type { GameConfig, InputState } from './types'

import * as PIXI from 'pixi.js'
import { GameScene } from '@/scenes/GameScene'
import { SceneManager } from './SceneManager'
import { GameState } from './types'

export class Game {
  public app!: PIXI.Application
  public sceneManager!: SceneManager
  public config: GameConfig
  public input: InputState
  private lastTime: number = 0

  constructor() {
    this.config = {
      width: 1024,
      height: 768,
      backgroundColor: 0x1A1A2E,
      gravity: 0.8,
      targetFPS: 60,
    }

    this.input = {
      left: false,
      right: false,
      jump: false,
      restart: false,
      next: false,
      debug: false,
    }

    this.setupInputHandling()
  }

  private async initPixiApp(): Promise<void> {
    // Create empty application first, then initialize with options
    this.app = new PIXI.Application()

    // Initialize with options using the recommended init() method
    await this.app.init({
      width: this.config.width,
      height: this.config.height,
      backgroundColor: this.config.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    // Clear existing content and add canvas
    const appDiv = document.querySelector<HTMLDivElement>('#app')!
    appDiv.innerHTML = ''
    appDiv.appendChild(this.app.canvas)

    // Style the canvas
    this.app.canvas.style.display = 'block'
    this.app.canvas.style.margin = '0 auto'
    this.app.canvas.style.border = '2px solid #0ea5e9'
    this.app.canvas.style.borderRadius = '8px'
  }

  private setupInputHandling(): void {
    const keyMap: { [key: string]: keyof InputState } = {
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
      Space: 'jump',
      ArrowUp: 'jump',
      KeyW: 'jump',
      KeyR: 'restart',
      KeyN: 'next',
      KeyQ: 'debug',
    }

    window.addEventListener('keydown', (e) => {
      const action = keyMap[e.code]
      if (action) {
        this.input[action] = true
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      const action = keyMap[e.code]
      if (action) {
        this.input[action] = false
        e.preventDefault()
      }
    })

    // Prevent context menu on right click
    window.addEventListener('contextmenu', e => e.preventDefault())
  }

  private setupResizeHandling(): void {
    window.addEventListener('resize', () => {
      const container = document.querySelector('#app') as HTMLElement
      const maxWidth = container.clientWidth
      const maxHeight = window.innerHeight - 40

      const scale = Math.min(maxWidth / this.config.width, maxHeight / this.config.height)
      const newWidth = this.config.width * scale
      const newHeight = this.config.height * scale

      this.sceneManager.resize(newWidth, newHeight)
    })
  }

  async start(): Promise<void> {
    // Initialize PIXI app first
    await this.initPixiApp()

    // Create scene manager after app is initialized
    this.sceneManager = new SceneManager(this.app)

    // Setup resize handling after app is ready
    this.setupResizeHandling()

    this.sceneManager.gameState = GameState.LOADING

    // Start the main game scene
    const gameScene = new GameScene(this)
    await this.sceneManager.changeScene(gameScene)

    this.sceneManager.gameState = GameState.PLAYING

    // Start the game loop
    this.app.ticker.add(() => this.gameLoop())
  }

  private gameLoop(): void {
    const currentTime = performance.now()
    const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 16.67 : 1 // Normalize to 60fps
    this.lastTime = currentTime

    this.sceneManager.update(deltaTime)
  }

  pause(): void {
    this.sceneManager.pause()
  }

  resume(): void {
    this.sceneManager.resume()
  }
}
