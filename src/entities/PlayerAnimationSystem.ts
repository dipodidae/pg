import * as PIXI from 'pixi.js'

export enum PlayerAnimationState {
  IDLE = 'idle',
  WALK = 'walk',
  JUMP = 'jump',
  FALL = 'fall',
  LAND = 'land',
}

export interface AnimationFrame {
  texture: PIXI.Texture
  duration: number
}

export class PlayerAnimationSystem {
  private textures: Map<string, PIXI.Texture> = new Map()
  private animations: Map<PlayerAnimationState, AnimationFrame[]> = new Map()
  private currentState: PlayerAnimationState = PlayerAnimationState.IDLE
  private currentFrame: number = 0
  private animationTimer: number = 0
  private sprite: PIXI.Sprite
  private isReady: boolean = false

  constructor() {
    this.sprite = new PIXI.Sprite()
    this.sprite.anchor.set(0.5)
    this.setupAnimations()
  }

  private async setupAnimations(): Promise<void> {
    try {
      // Load all SVG textures
      const texturePromises = [
        this.loadTexture('idle', '/assets/sprites/player-idle.svg'),
        this.loadTexture('walk1', '/assets/sprites/player-walk1.svg'),
        this.loadTexture('walk2', '/assets/sprites/player-walk2.svg'),
        this.loadTexture('jump', '/assets/sprites/player-jump.svg'),
        this.loadTexture('fall', '/assets/sprites/player-fall.svg'),
        this.loadTexture('land', '/assets/sprites/player-land.svg'),
      ]

      await Promise.all(texturePromises)

      // Define animation sequences
      this.animations.set(PlayerAnimationState.IDLE, [
        { texture: this.textures.get('idle')!, duration: 1000 },
      ])

      this.animations.set(PlayerAnimationState.WALK, [
        { texture: this.textures.get('walk1')!, duration: 200 },
        { texture: this.textures.get('idle')!, duration: 100 },
        { texture: this.textures.get('walk2')!, duration: 200 },
        { texture: this.textures.get('idle')!, duration: 100 },
      ])

      this.animations.set(PlayerAnimationState.JUMP, [
        { texture: this.textures.get('jump')!, duration: 500 },
      ])

      this.animations.set(PlayerAnimationState.FALL, [
        { texture: this.textures.get('fall')!, duration: 500 },
      ])

      this.animations.set(PlayerAnimationState.LAND, [
        { texture: this.textures.get('land')!, duration: 150 },
      ])

      // Set initial texture
      this.sprite.texture = this.textures.get('idle')!
      this.isReady = true
    }
    catch (error) {
      console.error('Failed to load player animations:', error)
      // Fallback to a simple colored rectangle if SVGs fail to load
      this.createFallbackSprite()
    }
  }

  private async loadTexture(name: string, path: string): Promise<void> {
    try {
      const texture = await PIXI.Assets.load(path)
      this.textures.set(name, texture)
    }
    catch (error) {
      console.warn(`Failed to load texture ${name} from ${path}:`, error)
      // Use white texture as fallback
      this.textures.set(name, PIXI.Texture.WHITE)
    }
  }

  private createFallbackSprite(): void {
    // Create a simple fallback texture using PIXI.Texture.WHITE with tint
    this.sprite.texture = PIXI.Texture.WHITE
    this.sprite.width = 32
    this.sprite.height = 44
    this.sprite.tint = 0x4ECDC4
    this.isReady = true
  }

  public update(deltaTime: number): void {
    if (!this.isReady)
      return

    const currentAnimation = this.animations.get(this.currentState)
    if (!currentAnimation || currentAnimation.length === 0)
      return

    this.animationTimer += deltaTime

    const currentFrameData = currentAnimation[this.currentFrame]
    if (this.animationTimer >= currentFrameData.duration) {
      this.animationTimer = 0
      this.currentFrame = (this.currentFrame + 1) % currentAnimation.length
      this.sprite.texture = currentAnimation[this.currentFrame].texture
    }
  }

  public setState(state: PlayerAnimationState, reset: boolean = false): void {
    if (this.currentState !== state || reset) {
      this.currentState = state
      this.currentFrame = 0
      this.animationTimer = 0

      const animation = this.animations.get(state)
      if (animation && animation.length > 0) {
        this.sprite.texture = animation[0].texture
      }
    }
  }

  public setFacing(facingRight: boolean): void {
    this.sprite.scale.x = facingRight ? 1 : -1
  }

  public setScale(scaleX: number, scaleY: number): void {
    const facing = this.sprite.scale.x >= 0 ? 1 : -1
    this.sprite.scale.set(scaleX * facing, scaleY)
  }

  public getSprite(): PIXI.Sprite {
    return this.sprite
  }

  public isLoaded(): boolean {
    return this.isReady
  }

  public destroy(): void {
    this.sprite.destroy()
    this.textures.clear()
    this.animations.clear()
  }
}
