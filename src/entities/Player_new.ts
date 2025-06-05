import type { Game } from '@/core/Game'
import type { Vector2 } from '@/core/types'
import * as PIXI from 'pixi.js'
import { ParticleSystem } from '@/effects/ParticleSystem'
import { SpriteGenerator } from '@/utils/SpriteGenerator'

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
    this.particles = new ParticleSystem(game.sceneManager.getCurrentScene()!.container)
  }

  private createSprite(): void {
    this.sprite = new PIXI.Container()
    this.playerGraphics = SpriteGenerator.createPlayerSprite()
    this.sprite.addChild(this.playerGraphics)

    // Add a subtle glow effect with a simple filter
    const colorMatrix = new PIXI.ColorMatrixFilter()
    colorMatrix.brightness(1.2, false)
    this.sprite.filters = [colorMatrix]
  }

  private setupInitialPosition(): void {
    this.sprite.x = this.game.config.width / 2
    this.sprite.y = this.groundY
  }

  update(deltaTime: number): void {
    this.handleInput()
    this.updatePhysics(deltaTime)
    this.updateAnimation(deltaTime)
    this.updateEffects(deltaTime)
    this.checkCollisions()
  }

  private handleInput(): void {
    const input = this.game.input
    this.isMoving = false

    // Horizontal movement
    if (input.left) {
      this.velocity.x = -this.speed
      this.facingRight = false
      this.isMoving = true
    }
    else if (input.right) {
      this.velocity.x = this.speed
      this.facingRight = true
      this.isMoving = true
    }
    else {
      this.velocity.x *= 0.8 // Friction
    }

    // Jumping
    if (input.jump && this.isOnGround) {
      this.velocity.y = -this.jumpPower
      this.isOnGround = false
      this.game.sceneManager.soundManager?.playJumpSound()
      this.particles.emitJumpDust(this.sprite.x, this.sprite.y + this.size / 2)

      // Jump squash effect
      this.squashStretch = 0.7
    }
  }

  private updatePhysics(deltaTime: number): void {
    // Apply gravity
    if (!this.isOnGround) {
      this.velocity.y += this.game.config.gravity * deltaTime
    }

    // Update position
    this.sprite.x += this.velocity.x * deltaTime
    this.sprite.y += this.velocity.y * deltaTime

    // Screen boundaries
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

  private updateAnimation(deltaTime: number): void {
    this.animationTimer += deltaTime

    // Walking animation
    if (this.isMoving && this.isOnGround) {
      const bobAmount = Math.sin(this.animationTimer * 0.3) * 2
      this.playerGraphics.y = bobAmount
    }
    else {
      this.playerGraphics.y = 0
    }

    // Facing direction
    this.playerGraphics.scale.x = this.facingRight ? 1 : -1

    // Landing effect
    if (this.landingScale > 1) {
      this.landingScale = Math.max(1, this.landingScale - 0.05 * deltaTime)
    }

    // Squash and stretch
    if (this.squashStretch < 1) {
      this.squashStretch = Math.min(1, this.squashStretch + 0.1 * deltaTime)
    }

    // Apply scaling effects
    this.playerGraphics.scale.y = this.landingScale * this.squashStretch
  }

  private updateEffects(_deltaTime: number): void {
    this.particles.update()
  }

  private checkCollisions(): void {
    // Ground collision
    const groundLevel = this.groundY
    if (this.sprite.y >= groundLevel && this.velocity.y >= 0) {
      if (!this.wasOnGround) {
        // Just landed
        this.game.sceneManager.soundManager?.playLandSound()
        this.particles.emitLandDust(this.sprite.x, this.sprite.y + this.size / 2)
        this.landingScale = 1.3 // Bounce effect
      }

      this.sprite.y = groundLevel
      this.velocity.y = 0
      this.isOnGround = true
    }
    else {
      this.isOnGround = false
    }

    this.wasOnGround = this.isOnGround
  }

  getPosition(): Vector2 {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  getBounds(): PIXI.Rectangle {
    return new PIXI.Rectangle(
      this.sprite.x - this.size / 2,
      this.sprite.y - this.size / 2,
      this.size,
      this.size,
    )
  }
}
