import type { Vector2 } from '@/core/types'
import * as PIXI from 'pixi.js'

export class Collectible {
  public sprite: PIXI.Graphics
  public isCollected: boolean = false
  private animationTimer: number = 0
  private baseY: number

  constructor(x: number, y: number, type: 'coin' | 'gem' | 'star' = 'coin') {
    this.baseY = y
    this.sprite = this.createSprite(type)
    this.sprite.x = x
    this.sprite.y = y
  }

  private createSprite(type: string): PIXI.Graphics {
    const sprite = new PIXI.Graphics()

    switch (type) {
      case 'coin':
        // Gold coin
        sprite.beginFill(0xFFD700)
        sprite.drawCircle(0, 0, 12)
        sprite.endFill()

        sprite.beginFill(0xFFED4E)
        sprite.drawCircle(0, 0, 8)
        sprite.endFill()

        sprite.lineStyle(2, 0xFFC107)
        sprite.drawCircle(0, 0, 10)
        break

      case 'gem':
        // Purple gem
        sprite.beginFill(0x9C27B0)
        sprite.moveTo(0, -12)
        sprite.lineTo(8, -4)
        sprite.lineTo(8, 8)
        sprite.lineTo(0, 12)
        sprite.lineTo(-8, 8)
        sprite.lineTo(-8, -4)
        sprite.closePath()
        sprite.endFill()

        sprite.beginFill(0xE1BEE7)
        sprite.moveTo(0, -8)
        sprite.lineTo(4, -2)
        sprite.lineTo(4, 4)
        sprite.lineTo(0, 6)
        sprite.lineTo(-4, 4)
        sprite.lineTo(-4, -2)
        sprite.closePath()
        sprite.endFill()
        break

      case 'star':
        // Yellow star
        sprite.beginFill(0xFFEB3B)
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
          const outerRadius = 12
          const innerRadius = 6

          if (i === 0) {
            sprite.moveTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius)
          }
          else {
            sprite.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius)
          }

          const innerAngle = angle + Math.PI / 5
          sprite.lineTo(Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius)
        }
        sprite.closePath()
        sprite.endFill()
        break
    }

    // Add glow effect
    const colorMatrix = new PIXI.ColorMatrixFilter()
    colorMatrix.brightness(1.3, false)
    sprite.filters = [colorMatrix]

    return sprite
  }

  update(deltaTime: number): void {
    if (this.isCollected)
      return

    this.animationTimer += deltaTime

    // Floating animation
    this.sprite.y = this.baseY + Math.sin(this.animationTimer * 0.1) * 3

    // Rotation
    this.sprite.rotation += 0.02 * deltaTime

    // Pulsing scale
    const scale = 1 + Math.sin(this.animationTimer * 0.15) * 0.1
    this.sprite.scale.set(scale)
  }

  collect(): void {
    this.isCollected = true
    this.sprite.visible = false
  }

  getBounds(): PIXI.Rectangle {
    return new PIXI.Rectangle(
      this.sprite.x - 12,
      this.sprite.y - 12,
      24,
      24,
    )
  }

  getPosition(): Vector2 {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite)
    }
    this.sprite.destroy()
  }
}
