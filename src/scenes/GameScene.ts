import type { Game } from '@/core/Game'
import * as PIXI from 'pixi.js'
import { Camera } from '@/core/Camera'
import { Collectible } from '@/entities/Collectible'
import { Player } from '@/entities/Player'
import { SpriteGenerator } from '@/utils/SpriteGenerator'
import { Scene } from './Scene'

export class GameScene extends Scene {
  private player: Player
  private game: Game
  private debugText!: PIXI.Text
  private background!: PIXI.Graphics
  private platforms: PIXI.Graphics[] = []
  private stars: PIXI.Graphics[] = []
  private parallaxContainer: PIXI.Container
  private collectibles: Collectible[] = []
  private camera!: Camera
  private worldContainer!: PIXI.Container
  private uiContainer!: PIXI.Container
  private score: number = 0
  private scoreText!: PIXI.Text

  constructor(game: Game) {
    super(game.app)
    this.game = game
    this.player = new Player(this.game)
    this.parallaxContainer = new PIXI.Container()
    this.setupContainers()
    this.setupCamera()
    this.setupBackground()
    this.setupPlatforms()
    this.setupCollectibles()
    this.setupUI()
  }

  private setupContainers(): void {
    this.worldContainer = new PIXI.Container()
    this.uiContainer = new PIXI.Container()

    this.container.addChild(this.worldContainer)
    this.container.addChild(this.uiContainer)
  }

  private setupCamera(): void {
    this.camera = new Camera(
      this.worldContainer,
      this.game.config.width * 2, // World is twice as wide
      this.game.config.height,
      this.game.config.width,
      this.game.config.height,
    )
  }

  private setupBackground(): void {
    // Create beautiful gradient background
    this.background = SpriteGenerator.createBackground(this.game.config.width * 2, this.game.config.height)
    this.worldContainer.addChild(this.background)

    // Add parallax stars
    this.worldContainer.addChild(this.parallaxContainer)
    for (let i = 0; i < 100; i++) {
      const star = new PIXI.Graphics()
      const size = Math.random() * 2 + 0.5
      const alpha = Math.random() * 0.8 + 0.2
      star.beginFill(0xFFFFFF, alpha)
      star.drawCircle(0, 0, size)
      star.endFill()
      star.x = Math.random() * this.game.config.width * 2
      star.y = Math.random() * this.game.config.height * 0.7;

      // Add twinkling effect data
      (star as any).userData = {
        baseAlpha: alpha,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      }

      this.stars.push(star)
      this.parallaxContainer.addChild(star)
    }

    // Add ground
    const ground = SpriteGenerator.createPlatformSprite(this.game.config.width * 2, 60)
    ground.y = this.game.config.height - 60
    this.worldContainer.addChild(ground)
  }

  private setupPlatforms(): void {
    // Create some floating platforms with wider world
    const platformData = [
      { x: 200, y: 500, width: 150, height: 20 },
      { x: 400, y: 400, width: 120, height: 20 },
      { x: 650, y: 350, width: 180, height: 20 },
      { x: 150, y: 300, width: 100, height: 20 },
      { x: 550, y: 250, width: 140, height: 20 },
      { x: 900, y: 450, width: 160, height: 20 },
      { x: 1200, y: 350, width: 140, height: 20 },
      { x: 1100, y: 200, width: 120, height: 20 },
      { x: 1400, y: 400, width: 180, height: 20 },
    ]

    platformData.forEach((data) => {
      const platform = SpriteGenerator.createPlatformSprite(data.width, data.height)
      platform.x = data.x
      platform.y = data.y
      this.platforms.push(platform)
      this.worldContainer.addChild(platform)
    })
  }

  private setupCollectibles(): void {
    // Add some collectibles throughout the level
    const collectibleData = [
      { x: 300, y: 400, type: 'coin' as const },
      { x: 500, y: 300, type: 'gem' as const },
      { x: 150, y: 250, type: 'coin' as const },
      { x: 700, y: 200, type: 'star' as const },
      { x: 600, y: 450, type: 'coin' as const },
      { x: 350, y: 150, type: 'gem' as const },
    ]

    collectibleData.forEach((data) => {
      const collectible = new Collectible(data.x, data.y, data.type)
      this.collectibles.push(collectible)
      this.worldContainer.addChild(collectible.sprite)
    })
  }

  private setupUI(): void {
    // Score display
    this.scoreText = new PIXI.Text('Score: 0', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
    })
    this.scoreText.x = 20
    this.scoreText.y = 20
    this.uiContainer.addChild(this.scoreText)

    // Debug text
    this.debugText = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xFFFFFF,
      align: 'left',
    })
    this.debugText.x = 20
    this.debugText.y = 60
    this.uiContainer.addChild(this.debugText)
  }

  async init(): Promise<void> {
    this.worldContainer.addChild(this.player.sprite)

    // Add welcome message
    const welcomeText = new PIXI.Text('🎮 EPIC PLATFORMER 🎮', {
      fontFamily: 'Arial',
      fontSize: 36,
      fontWeight: 'bold',
      fill: 0x4ECDC4,
      align: 'center',
    })
    welcomeText.anchor.set(0.5)
    welcomeText.x = this.game.config.width / 2
    welcomeText.y = 60
    this.uiContainer.addChild(welcomeText)

    const instructionText = new PIXI.Text('Use ARROW KEYS or WASD to move and jump!\nCollect coins, gems, and stars!', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xFFE66D,
      align: 'center',
    })
    instructionText.anchor.set(0.5)
    instructionText.x = this.game.config.width / 2
    instructionText.y = 100
    this.uiContainer.addChild(instructionText)
  }

  update(deltaTime: number): void {
    this.player.update(deltaTime)

    // Update camera to follow player
    this.camera.setTarget(this.player.sprite.x, this.player.sprite.y - 100)
    this.camera.update(deltaTime)

    // Update collectibles
    this.collectibles.forEach((collectible) => {
      collectible.update(deltaTime)

      // Check collision with player
      if (!collectible.isCollected && this.checkCollision(this.player.getBounds(), collectible.getBounds())) {
        collectible.collect()
        this.score += this.getCollectibleScore(collectible)
        this.scoreText.text = `Score: ${this.score}`
        this.game.sceneManager.soundManager?.playCollectSound()
        this.camera.shake(3, 100)
      }
    })

    // Update star twinkling effect
    this.stars.forEach((star: any) => {
      const data = star.userData
      const time = Date.now() * data.twinkleSpeed
      star.alpha = data.baseAlpha + Math.sin(time) * 0.3
    })

    // Subtle parallax movement
    this.parallaxContainer.x = -this.player.sprite.x * 0.1

    // Update debug info
    this.debugText.text = `FPS: ${Math.round(this.app.ticker.FPS)}
Position: (${Math.round(this.player.sprite.x)}, ${Math.round(this.player.sprite.y)})
Velocity: (${this.player.velocity.x.toFixed(1)}, ${this.player.velocity.y.toFixed(1)})
On Ground: ${this.player.isOnGround}
Controls: ${this.getActiveControls()}`
  }

  private checkCollision(rect1: PIXI.Rectangle, rect2: PIXI.Rectangle): boolean {
    return rect1.x < rect2.x + rect2.width
      && rect1.x + rect1.width > rect2.x
      && rect1.y < rect2.y + rect2.height
      && rect1.y + rect1.height > rect2.y
  }

  private getCollectibleScore(collectible: Collectible): number {
    // Different scores for different collectible types
    const sprite = collectible.sprite
    if (sprite.tint === 0xFFD700)
      return 10 // coin
    if (sprite.tint === 0x9C27B0)
      return 25 // gem
    if (sprite.tint === 0xFFEB3B)
      return 50 // star
    return 10 // default
  }

  private getActiveControls(): string {
    const active = []
    if (this.game.input.left)
      active.push('LEFT')
    if (this.game.input.right)
      active.push('RIGHT')
    if (this.game.input.jump)
      active.push('JUMP')
    return active.length > 0 ? active.join(', ') : 'NONE'
  }

  async destroy(): Promise<void> {
    this.container.removeChildren()
    this.player.destroy()
  }

  resize(width: number, height: number): void {
    // Handle resize if needed
    const scaleX = width / this.game.config.width
    const scaleY = height / this.game.config.height
    this.container.scale.set(Math.min(scaleX, scaleY))
  }
}
