import type * as PIXI from 'pixi.js'
import type { Vector2 } from '@/core/types'

export class Camera {
  public container: PIXI.Container
  public position: Vector2 = { x: 0, y: 0 }
  private target: Vector2 = { x: 0, y: 0 }
  private worldWidth: number
  private worldHeight: number
  private viewWidth: number
  private viewHeight: number
  private smoothing: number = 0.1

  constructor(container: PIXI.Container, worldWidth: number, worldHeight: number, viewWidth: number, viewHeight: number) {
    this.container = container
    this.worldWidth = worldWidth
    this.worldHeight = worldHeight
    this.viewWidth = viewWidth
    this.viewHeight = viewHeight
  }

  setTarget(x: number, y: number): void {
    this.target.x = x
    this.target.y = y
  }

  update(_deltaTime: number): void {
    // Smooth camera movement
    this.position.x += (this.target.x - this.position.x) * this.smoothing
    this.position.y += (this.target.y - this.position.y) * this.smoothing

    // Keep camera within world bounds
    this.position.x = Math.max(this.viewWidth / 2, Math.min(this.worldWidth - this.viewWidth / 2, this.position.x))
    this.position.y = Math.max(this.viewHeight / 2, Math.min(this.worldHeight - this.viewHeight / 2, this.position.y))

    // Apply camera position to container
    this.container.x = -this.position.x + this.viewWidth / 2
    this.container.y = -this.position.y + this.viewHeight / 2
  }

  shake(intensity: number = 5, duration: number = 200): void {
    const originalX = this.container.x
    const originalY = this.container.y
    const startTime = Date.now()

    const shakeLoop = () => {
      const elapsed = Date.now() - startTime
      if (elapsed < duration) {
        const progress = elapsed / duration
        const currentIntensity = intensity * (1 - progress)

        this.container.x = originalX + (Math.random() - 0.5) * currentIntensity
        this.container.y = originalY + (Math.random() - 0.5) * currentIntensity

        requestAnimationFrame(shakeLoop)
      }
      else {
        this.container.x = originalX
        this.container.y = originalY
      }
    }

    shakeLoop()
  }

  worldToScreen(worldPos: Vector2): Vector2 {
    return {
      x: worldPos.x - this.position.x + this.viewWidth / 2,
      y: worldPos.y - this.position.y + this.viewHeight / 2,
    }
  }

  screenToWorld(screenPos: Vector2): Vector2 {
    return {
      x: screenPos.x + this.position.x - this.viewWidth / 2,
      y: screenPos.y + this.position.y - this.viewHeight / 2,
    }
  }
}
