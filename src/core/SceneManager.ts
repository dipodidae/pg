import type * as PIXI from 'pixi.js'
import type { Scene } from '@/scenes/Scene'
import { SoundManager } from '@/audio/SoundManager'
import { GameState } from './types'

export class SceneManager {
  private currentScene: Scene | null = null
  private stage: PIXI.Container
  private app: PIXI.Application
  public gameState: GameState = GameState.LOADING
  public soundManager?: SoundManager

  constructor(app: PIXI.Application) {
    this.app = app
    this.stage = app.stage
    this.soundManager = new SoundManager()
  }

  async changeScene(scene: Scene): Promise<void> {
    // Cleanup current scene
    if (this.currentScene) {
      this.stage.removeChild(this.currentScene.container)
      await this.currentScene.destroy()
    }

    // Setup new scene
    this.currentScene = scene
    this.stage.addChild(scene.container)
    await scene.init()
  }

  update(deltaTime: number): void {
    if (this.currentScene && this.gameState === GameState.PLAYING) {
      this.currentScene.update(deltaTime)
    }
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height)
    this.currentScene?.resize?.(width, height)
  }

  pause(): void {
    this.gameState = GameState.PAUSED
  }

  resume(): void {
    this.gameState = GameState.PLAYING
  }

  getCurrentScene(): Scene | null {
    return this.currentScene
  }
}
