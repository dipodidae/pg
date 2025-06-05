import type { Vector2 } from '../core/types'
import * as PIXI from 'pixi.js'

export class Orb {
  public sprite: PIXI.Graphics
  public isCollected: boolean = false
  public targetLevel: number
  private animationTimer: number = 0
  private pulseScale: number = 1.0
  private glowIntensity: number = 0.5

  constructor(x: number, y: number, targetLevel: number = 2) {
    this.targetLevel = targetLevel
    this.sprite = this.createSprite()
    this.sprite.x = x
    this.sprite.y = y
  }

  private createSprite(): PIXI.Graphics {
    const graphics = new PIXI.Graphics()

    // Outer glow/aura
    graphics.beginFill(0x00FFFF, 0.2)
    graphics.drawCircle(0, 0, 25)

    // Main orb body
    graphics.beginFill(0x00FFFF, 0.8)
    graphics.lineStyle(3, 0x0080FF, 1)
    graphics.drawCircle(0, 0, 20)

    // Inner highlight
    graphics.beginFill(0xFFFFFF, 0.4)
    graphics.drawCircle(-5, -5, 8)

    // Core
    graphics.beginFill(0x00FFFF, 0.9)
    graphics.drawCircle(0, 0, 12)

    graphics.endFill()
    return graphics
  }

  update(deltaTime: number): void {
    if (this.isCollected)
      return

    // Animate pulsing and glowing
    this.animationTimer += deltaTime * 0.003

    // Pulsing scale effect
    this.pulseScale = 1.0 + Math.sin(this.animationTimer) * 0.15

    // Glowing intensity
    this.glowIntensity = 0.5 + Math.sin(this.animationTimer * 1.5) * 0.3

    // Apply animations
    this.sprite.scale.set(this.pulseScale)
    this.sprite.alpha = 0.8 + this.glowIntensity * 0.2

    // Floating motion
    const floatOffset = Math.sin(this.animationTimer * 0.8) * 3
    this.sprite.y += floatOffset * deltaTime * 0.016
  }

  collect(): void {
    if (this.isCollected)
      return

    this.isCollected = true

    // Collection animation - scale up and fade out
    const fadeOut = () => {
      this.sprite.alpha -= 0.05
      this.sprite.scale.x += 0.02
      this.sprite.scale.y += 0.02

      if (this.sprite.alpha <= 0) {
        this.destroy()
      }
      else {
        requestAnimationFrame(fadeOut)
      }
    }

    fadeOut()
  }

  getBounds(): PIXI.Rectangle {
    const bounds = this.sprite.getBounds()
    return new PIXI.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  getPosition(): Vector2 {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  // Check if player is close enough to interact
  canInteract(playerPosition: Vector2, threshold: number = 30): boolean {
    if (this.isCollected)
      return false

    const dx = this.sprite.x - playerPosition.x
    const dy = this.sprite.y - playerPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance <= threshold
  }

  destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite)
    }
    this.sprite.destroy()
  }
}
