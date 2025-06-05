import type { Game } from '@/core/Game'
import type { Vector2 } from '@/core/types'
import type { ParticleSystem } from '@/effects/ParticleSystem'
import * as PIXI from 'pixi.js'

export class Player {
  public sprite: PIXI.Container
  public velocity: Vector2 = { x: 0, y: 0 }
  public isOnGround: boolean = false

  private game: Game
  private playerGraphics: PIXI.Graphics
  private particles: ParticleSystem
  private speed: number = 8
  private jumpPower: number = 18
  private size: number = 32
  private groundY: number

  // Animation properties
  private animationTimer: number = 0
  private isMoving: boolean = false
  private facingRight: boolean = true
  private wasOnGround: boolean = false

  // Juice effects
  private landingScale: number = 1
  private squashStretch: number = 1

  constructor(game: Game) {
    this.game = game
    this.groundY = game.config.height - 60 - this.size / 2
    this.createSprite()
    this.setupInitialPosition()
  }

  private createSprite(): void {
    this.sprite = new PIXI.Graphics()

    // Create a cool-looking player character
    // Body
    this.sprite.beginFill(0xFF6B6B)
    this.sprite.drawRoundedRect(-this.size / 2, -this.size / 2, this.size, this.size, 8)
    this.sprite.endFill()

    // Eyes
    this.sprite.beginFill(0xFFFFFF)
    this.sprite.drawCircle(-8, -8, 4)
    this.sprite.drawCircle(8, -8, 4)
    this.sprite.endFill()

    this.sprite.beginFill(0x000000)
    this.sprite.drawCircle(-6, -8, 2)
    this.sprite.drawCircle(10, -8, 2)
    this.sprite.endFill()

    // Mouth
    this.sprite.lineStyle(2, 0x000000)
    this.sprite.moveTo(-6, 4)
    this.sprite.quadraticCurveTo(0, 8, 6, 4)

    // Add a subtle glow effect
    const glowFilter = new PIXI.filters.GlowFilter({
      distance: 8,
      outerStrength: 1,
      innerStrength: 0.5,
      color: 0xFF6B6B,
      quality: 0.5,
    })
    this.sprite.filters = [glowFilter]
  }

  private setupInitialPosition(): void {
    this.sprite.x = this.game.config.width / 2
    this.sprite.y = this.groundY
    this.isOnGround = true
  }

  update(deltaTime: number): void {
    this.handleInput()
    this.applyPhysics(deltaTime)
    this.checkCollisions()
    this.updateAnimation(deltaTime)
  }

  private handleInput(): void {
    // Horizontal movement
    if (this.game.input.left) {
      this.velocity.x = Math.max(this.velocity.x - 0.8, -this.speed)
      this.sprite.scale.x = Math.abs(this.sprite.scale.x) * -1 // Face left
    }
    else if (this.game.input.right) {
      this.velocity.x = Math.min(this.velocity.x + 0.8, this.speed)
      this.sprite.scale.x = Math.abs(this.sprite.scale.x) // Face right
    }
    else {
      // Apply friction
      this.velocity.x *= 0.85
      if (Math.abs(this.velocity.x) < 0.1) {
        this.velocity.x = 0
      }
    }

    // Jumping
    if (this.game.input.jump && this.isOnGround) {
      this.velocity.y = -this.jumpPower
      this.isOnGround = false

      // Add a little bounce effect
      this.sprite.scale.y = 0.8
    }
  }

  private applyPhysics(deltaTime: number): void {
    // Apply gravity
    if (!this.isOnGround) {
      this.velocity.y += this.game.config.gravity * deltaTime
    }

    // Update position
    this.sprite.x += this.velocity.x * deltaTime
    this.sprite.y += this.velocity.y * deltaTime

    // Keep player within screen bounds
    const halfSize = this.size / 2
    if (this.sprite.x < halfSize) {
      this.sprite.x = halfSize
      this.velocity.x = 0
    }
    else if (this.sprite.x > this.game.config.width - halfSize) {
      this.sprite.x = this.game.config.width - halfSize
      this.velocity.x = 0
    }
  }

  private checkCollisions(): void {
    // Ground collision
    if (this.sprite.y >= this.groundY) {
      this.sprite.y = this.groundY
      this.velocity.y = 0
      this.isOnGround = true
    }
  }

  private updateAnimation(_deltaTime: number): void {
    // Restore scale gradually
    this.sprite.scale.y = PIXI.utils.lerp(this.sprite.scale.y, 1, 0.15)

    // Subtle floating animation when on ground
    if (this.isOnGround && Math.abs(this.velocity.x) < 0.1) {
      this.sprite.y += Math.sin(Date.now() * 0.005) * 0.5
    }

    // Rotation when moving
    if (Math.abs(this.velocity.x) > 0.1) {
      this.sprite.rotation = Math.sin(Date.now() * 0.01) * 0.05
    }
    else {
      this.sprite.rotation = PIXI.utils.lerp(this.sprite.rotation, 0, 0.1)
    }
  }

  destroy(): void {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite)
    }
    this.sprite.destroy()
  }
}
