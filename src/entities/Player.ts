import type { Game } from '@/core/Game'
import type { Vector2 } from '@/core/types'
import * as PIXI from 'pixi.js'
import { ParticleSystem } from '@/effects/ParticleSystem'
import { PlayerAnimationState, PlayerAnimationSystem } from './PlayerAnimationSystem'

export class Player {
  public sprite!: PIXI.Container
  public velocity: Vector2 = { x: 0, y: 0 }
  public isOnGround: boolean = false

  private game: Game
  private animationSystem!: PlayerAnimationSystem
  private particles!: ParticleSystem
  private speed: number = 8
  private jumpPower: number = 18
  private size: number = 32
  private groundY: number
  private platformCollisionCheck?: (playerBounds: PIXI.Rectangle) => { x: number, y: number, width: number, height: number } | null
  private debugBox!: PIXI.Graphics
  private showDebug: boolean = true
  private worldWidth: number = 0
  private worldHeight: number = 0
  private currentPlatform: { x: number, y: number, width: number, height: number } | null = null

  // Animation properties
  private animationTimer: number = 0
  private isMoving: boolean = false
  private facingRight: boolean = true
  private wasOnGround: boolean = false
  private fallTimer: number = 0 // Prevent rapid fall animation switching

  // Juice effects
  private landingScale: number = 1
  private squashStretch: number = 1

  constructor(game: Game) {
    this.game = game
    this.groundY = game.config.height - 60 - this.size / 2
    this.createSprite()
    this.setupInitialPosition()

    // Initialize particle system
    const currentScene = this.game.sceneManager.getCurrentScene()
    if (currentScene) {
      this.particles = new ParticleSystem(currentScene.container)
    }
  }

  private createSprite(): void {
    this.sprite = new PIXI.Container()
    this.animationSystem = new PlayerAnimationSystem()
    this.sprite.addChild(this.animationSystem.getSprite())

    // Add subtle glow filter
    const colorMatrix = new PIXI.ColorMatrixFilter()
    colorMatrix.brightness(1.2, false)
    this.sprite.filters = [colorMatrix]

    // Create debug collision box
    this.createDebugBox()
  }

  private createDebugBox(): void {
    this.debugBox = new PIXI.Graphics()
    this.debugBox.rect(-this.size / 2, -this.size / 2, this.size, this.size)
    this.debugBox.stroke({ color: 0xFF00FF, width: 2, alpha: 0.8, pixelLine: true })
    this.debugBox.visible = this.showDebug
    this.sprite.addChild(this.debugBox)
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
      this.currentPlatform = null // Clear platform reference when jumping
      this.game.sceneManager.soundManager?.playJumpSound()

      if (this.particles) {
        this.particles.emitJumpDust(this.sprite.x, this.sprite.y + this.size / 2)
      }

      // Jump squash effect
      this.squashStretch = 0.7
    }
  }

  private updatePhysics(deltaTime: number): void {
    // Apply gravity
    if (!this.isOnGround) {
      this.velocity.y += this.game.config.gravity * deltaTime
    }
    else {
      // When on ground/platform, dampen any small vertical velocity to prevent trembling
      if (Math.abs(this.velocity.y) < 0.5) {
        this.velocity.y = 0
      }
    }

    // Update horizontal position first
    this.sprite.x += this.velocity.x * deltaTime

    // Update vertical position
    const newY = this.sprite.y + this.velocity.y * deltaTime

    // Check for platform collisions
    let hitPlatform = false
    if (this.platformCollisionCheck) {
      // First, check if we're still on our current platform
      if (this.currentPlatform && this.isOnGround) {
        const platformTop = this.currentPlatform.y
        const playerBottom = this.sprite.y + this.size / 2
        const playerLeft = this.sprite.x - this.size / 2
        const playerRight = this.sprite.x + this.size / 2
        const platformLeft = this.currentPlatform.x
        const platformRight = this.currentPlatform.x + this.currentPlatform.width

        // Check if we're still horizontally on the platform and close to the top
        const onPlatformHorizontally = playerRight > platformLeft && playerLeft < platformRight
        const nearPlatformTop = Math.abs(playerBottom - platformTop) <= 3
        const notJumping = this.velocity.y >= -1

        if (onPlatformHorizontally && nearPlatformTop && notJumping) {
          // Stay on current platform - only adjust Y if we've drifted
          if (Math.abs(playerBottom - platformTop) > 1) {
            this.sprite.y = platformTop - this.size / 2
          }
          this.velocity.y = 0
          this.isOnGround = true
          hitPlatform = true
        }
        else {
          // Left the platform
          this.currentPlatform = null
        }
      }

      // If not on a platform, check for new platform collision
      if (!hitPlatform) {
        const futurePlayerBounds = new PIXI.Rectangle(
          this.sprite.x - this.size / 2,
          newY - this.size / 2,
          this.size,
          this.size,
        )

        const platform = this.platformCollisionCheck(futurePlayerBounds)
        if (platform && this.velocity.y >= 0) { // Only when falling or stationary
          const platformTop = platform.y
          const playerBottom = newY + this.size / 2
          const currentPlayerBottom = this.sprite.y + this.size / 2

          // Check if we're landing on top of platform (not inside it)
          if (currentPlayerBottom <= platformTop + 5 && playerBottom >= platformTop) {
            this.sprite.y = platformTop - this.size / 2
            this.velocity.y = 0
            this.isOnGround = true
            this.currentPlatform = platform
            hitPlatform = true

            if (!this.wasOnGround) {
              // Landing effects
              this.game.sceneManager.soundManager?.playLandSound()
              if (this.particles) {
                this.particles.emitLandDust(this.sprite.x, this.sprite.y + this.size / 2)
              }
              this.landingScale = 1.3
            }
          }
        }
      }
    }

    // If we didn't hit a platform, update Y position normally
    if (!hitPlatform) {
      this.sprite.y = newY

      // Check ground collision
      const groundLevel = this.groundY
      if (this.sprite.y >= groundLevel && this.velocity.y >= 0) {
        if (!this.wasOnGround) {
          // Landing effects
          this.game.sceneManager.soundManager?.playLandSound()
          if (this.particles) {
            this.particles.emitLandDust(this.sprite.x, this.sprite.y + this.size / 2)
          }
          this.landingScale = 1.3
        }
        this.sprite.y = groundLevel
        this.velocity.y = 0
        this.isOnGround = true
      }
      else {
        this.isOnGround = false
        this.currentPlatform = null // Clear platform reference when falling
      }
    }

    this.wasOnGround = this.isOnGround

    // Screen boundaries - use world dimensions if available, otherwise fall back to screen
    const halfSize = this.size / 2
    const rightBoundary = this.worldWidth > 0 ? this.worldWidth : this.game.config.width

    if (this.sprite.x < halfSize) {
      this.sprite.x = halfSize
      this.velocity.x = 0
    }
    else if (this.sprite.x > rightBoundary - halfSize) {
      this.sprite.x = rightBoundary - halfSize
      this.velocity.x = 0
    }
  }

  private updateAnimation(deltaTime: number): void {
    this.animationTimer += deltaTime

    // Update animation system
    this.animationSystem.update(deltaTime)

    // Update fall timer for stable animation switching
    if (!this.isOnGround) {
      this.fallTimer += deltaTime
    }
    else {
      this.fallTimer = 0
    }

    // Determine animation state with stability
    let animationState = PlayerAnimationState.IDLE
    if (!this.isOnGround) {
      if (this.velocity.y < 0) {
        animationState = PlayerAnimationState.JUMP
        this.fallTimer = 0 // Reset fall timer when jumping
      }
      else if (this.fallTimer > 100) { // Only show fall after 100ms of falling
        animationState = PlayerAnimationState.FALL
      }
      else {
        // Stay in previous state during brief air time
        animationState = this.isMoving ? PlayerAnimationState.WALK : PlayerAnimationState.IDLE
      }
    }
    else if (this.isMoving) {
      animationState = PlayerAnimationState.WALK
    }

    // Handle landing animation (takes priority)
    if (this.isOnGround && !this.wasOnGround) {
      animationState = PlayerAnimationState.LAND
    }

    this.animationSystem.setState(animationState)

    // Facing direction
    this.animationSystem.setFacing(this.facingRight)

    // Apply scaling effects (landing bounce and squash/stretch)
    this.animationSystem.setScale(1, this.landingScale * this.squashStretch)

    // Landing bounce effect
    if (this.landingScale > 1) {
      this.landingScale = Math.max(1, this.landingScale - 0.05 * deltaTime)
    }

    // Squash and stretch recovery
    if (this.squashStretch < 1) {
      this.squashStretch = Math.min(1, this.squashStretch + 0.1 * deltaTime)
    }
  }

  private updateEffects(_deltaTime: number): void {
    if (this.particles) {
      this.particles.update()
    }
  }

  // Remove the old checkCollisions method since collision is now handled in updatePhysics

  setPlatformCollisionCheck(collisionCheck: (playerBounds: PIXI.Rectangle) => { x: number, y: number, width: number, height: number } | null): void {
    this.platformCollisionCheck = collisionCheck
  }

  setWorldBoundaries(width: number, height: number): void {
    this.worldWidth = width
    this.worldHeight = height
  }

  toggleDebug(): void {
    this.showDebug = !this.showDebug
    this.debugBox.visible = this.showDebug
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

  destroy(): void {
    if (this.animationSystem) {
      this.animationSystem.destroy()
    }
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite)
    }
    this.sprite.destroy()
  }
}
