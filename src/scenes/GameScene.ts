import type { Game } from '@/core/Game'
import type { LevelData } from '@/levels/types'
import * as PIXI from 'pixi.js'
import { Camera } from '@/core/Camera'
import { Collectible } from '@/entities/Collectible'
import { Orb } from '@/entities/Orb'
import { Player } from '@/entities/Player'
import { LevelManager } from '@/levels/LevelManager'
import { SpriteGenerator } from '@/utils/SpriteGenerator'
import { Scene } from './Scene'

export class GameScene extends Scene {
  private player: Player
  private game: Game
  private debugText!: PIXI.Text
  private background!: PIXI.Graphics
  private platforms: PIXI.Graphics[] = []
  private platformDebugBoxes: PIXI.Graphics[] = []
  private stars: PIXI.Graphics[] = []
  private parallaxContainer: PIXI.Container
  private collectibles: Collectible[] = []
  private orbs: Orb[] = []
  private camera!: Camera
  private worldContainer!: PIXI.Container
  private uiContainer!: PIXI.Container
  private score: number = 0
  private scoreText!: PIXI.Text
  private levelManager: LevelManager
  private currentLevelData: LevelData | null = null
  private showDebugBoxes: boolean = true

  constructor(game: Game) {
    super(game.app)
    this.game = game
    this.player = new Player(this.game)
    this.parallaxContainer = new PIXI.Container()
    this.levelManager = new LevelManager(this.game)
    this.setupContainers()
    this.setupCamera()
    this.setupPlatformCollision()
  }

  private setupContainers(): void {
    this.worldContainer = new PIXI.Container()
    this.uiContainer = new PIXI.Container()

    this.container.addChild(this.worldContainer)
    this.container.addChild(this.uiContainer)
  }

  private setupCamera(): void {
    // Camera will be initialized when level loads with proper world dimensions
    this.camera = new Camera(
      this.worldContainer,
      this.game.config.width * 2, // Default, will be updated when level loads
      this.game.config.height,
      this.game.config.width,
      this.game.config.height,
    )
  }

  private setupPlatformCollision(): void {
    // Set up platform collision detection for the player
    this.player.setPlatformCollisionCheck((playerBounds: PIXI.Rectangle) => {
      // Check collision with all platforms - simplified approach
      for (const platform of this.platforms) {
        const platformBounds = {
          x: platform.x,
          y: platform.y,
          width: platform.width,
          height: platform.height,
        }

        // Simple rectangle overlap check
        const overlap = this.checkRectangleOverlap(playerBounds, platformBounds)
        if (overlap) {
          return platformBounds
        }
      }
      return null
    })
  }

  private checkRectangleOverlap(rect1: PIXI.Rectangle | { x: number, y: number, width: number, height: number }, rect2: { x: number, y: number, width: number, height: number }): boolean {
    return rect1.x < rect2.x + rect2.width
      && rect1.x + rect1.width > rect2.x
      && rect1.y < rect2.y + rect2.height
      && rect1.y + rect1.height > rect2.y
  }

  private async setupLevel(levelData: LevelData): Promise<void> {
    // Clear existing level data
    this.clearLevel()

    // Update camera with level dimensions
    this.camera = new Camera(
      this.worldContainer,
      levelData.width,
      levelData.height,
      this.game.config.width,
      this.game.config.height,
    )

    // Set player starting position and world boundaries
    this.player.sprite.x = levelData.playerStart.x
    this.player.sprite.y = levelData.playerStart.y
    this.player.setWorldBoundaries(levelData.width, levelData.height)

    // Create background
    this.setupBackgroundFromLevel(levelData)

    // Create platforms from level data
    this.setupPlatformsFromLevel(levelData)

    // Create collectibles from level data
    this.setupCollectiblesFromLevel(levelData)

    // Create orbs from level data
    this.setupOrbsFromLevel(levelData)

    // Setup UI
    this.setupUI()

    // Store current level data
    this.currentLevelData = levelData
  }

  private clearLevel(): void {
    // Remove existing platforms
    this.platforms.forEach((platform) => {
      if (platform.parent)
        platform.parent.removeChild(platform)
      platform.destroy()
    })
    this.platforms = []

    // Remove existing platform debug boxes
    this.platformDebugBoxes.forEach((debugBox) => {
      if (debugBox.parent)
        debugBox.parent.removeChild(debugBox)
      debugBox.destroy()
    })
    this.platformDebugBoxes = []

    // Remove existing collectibles
    this.collectibles.forEach((collectible) => {
      collectible.destroy()
    })
    this.collectibles = []

    // Remove existing orbs
    this.orbs.forEach((orb) => {
      orb.destroy()
    })
    this.orbs = []

    // Clear containers
    this.worldContainer.removeChildren()
    this.parallaxContainer.removeChildren()
  }

  private setupBackgroundFromLevel(levelData: LevelData): void {
    // Create background based on level data
    const bgColor = levelData.background?.color
      ? Number.parseInt(levelData.background.color.replace('#', ''), 16)
      : this.game.config.backgroundColor

    this.background = new PIXI.Graphics()
    this.background.beginFill(bgColor)
    this.background.drawRect(0, 0, levelData.width, levelData.height)
    this.background.endFill()
    this.worldContainer.addChild(this.background)

    // Add stars if specified
    if (levelData.background?.stars) {
      this.worldContainer.addChild(this.parallaxContainer)
      for (let i = 0; i < 100; i++) {
        const star = new PIXI.Graphics()
        const size = Math.random() * 2 + 0.5
        const alpha = Math.random() * 0.8 + 0.2
        star.beginFill(0xFFFFFF, alpha)
        star.drawCircle(0, 0, size)
        star.endFill()
        star.x = Math.random() * levelData.width
        star.y = Math.random() * levelData.height * 0.7

        // Add twinkling effect data
        ;(star as any).userData = {
          baseAlpha: alpha,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
        }

        this.stars.push(star)
        this.parallaxContainer.addChild(star)
      }
    }
  }

  private setupPlatformsFromLevel(levelData: LevelData): void {
    levelData.platforms.forEach((platformData) => {
      const platform = SpriteGenerator.createPlatformSprite(platformData.width, platformData.height)
      platform.x = platformData.x
      platform.y = platformData.y

      // Set color based on platform type
      if (platformData.type === 'moving') {
        platform.tint = 0x3498DB // Blue for moving platforms
      }
      else if (platformData.type === 'ice') {
        platform.tint = 0x74B9FF // Light blue for ice platforms
      }
      else if (platformData.type === 'breakable') {
        platform.tint = 0xE17055 // Orange for breakable platforms
      }

      this.platforms.push(platform)
      this.worldContainer.addChild(platform)

      // Create debug collision box for platform
      if (this.showDebugBoxes) {
        const debugBox = new PIXI.Graphics()
        debugBox.rect(0, 0, platformData.width, platformData.height)
        debugBox.stroke({ color: 0x00FF00, width: 2, alpha: 0.6 })
        debugBox.position.set(platformData.x, platformData.y)
        this.platformDebugBoxes.push(debugBox)
        this.worldContainer.addChild(debugBox)
      }
    })
  }

  private setupCollectiblesFromLevel(levelData: LevelData): void {
    levelData.collectibles.forEach((collectibleData) => {
      const collectible = new Collectible(collectibleData.x, collectibleData.y, collectibleData.type)
      this.collectibles.push(collectible)
      this.worldContainer.addChild(collectible.sprite)
    })
  }

  private setupOrbsFromLevel(levelData: LevelData): void {
    console.warn('Setting up orbs from level data:', levelData.orbs)
    if (levelData.orbs) {
      levelData.orbs.forEach((orbData) => {
        console.warn('Creating orb at:', orbData)
        const orb = new Orb(orbData.x, orbData.y, orbData.targetLevel)
        this.orbs.push(orb)
        this.worldContainer.addChild(orb.sprite)
      })
    }
    console.warn('Total orbs created:', this.orbs.length)
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
    // Load the first level
    try {
      const levelData = await this.levelManager.loadLevelByIndex(0)
      await this.setupLevel(levelData)
    }
    catch (error) {
      console.error('Failed to load level:', error)
      // Fall back to the fallback level
      const fallbackLevel = this.levelManager.getCurrentLevel()
      if (fallbackLevel) {
        await this.setupLevel(fallbackLevel)
      }
    }

    // TEMPORARY: Add test platforms to debug collision issue
    // Remove this once SVG loading is confirmed working
    if (this.platforms.length === 0) {
      console.warn('No platforms loaded from level, adding test platforms')
      const testPlatforms = [
        { x: 0, y: 740, width: 1600, height: 60 }, // Ground
        { x: 200, y: 600, width: 150, height: 20 },
        { x: 400, y: 500, width: 120, height: 20 },
        { x: 600, y: 400, width: 100, height: 20 },
      ]

      testPlatforms.forEach((data) => {
        const platform = SpriteGenerator.createPlatformSprite(data.width, data.height)
        platform.x = data.x
        platform.y = data.y
        this.platforms.push(platform)
        this.worldContainer.addChild(platform)

        // Create debug collision box for platform
        if (this.showDebugBoxes) {
          const debugBox = new PIXI.Graphics()
          debugBox.rect(0, 0, data.width, data.height)
          debugBox.stroke({ color: 0x00FF00, width: 2, alpha: 0.6, pixelLine: true })
          debugBox.position.set(data.x, data.y)
          this.platformDebugBoxes.push(debugBox)
          this.worldContainer.addChild(debugBox)
        }
      })
    }

    // Add player to world
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

    const instructionText = new PIXI.Text('Use ARROW KEYS or WASD to move and jump!\nCollect coins, gems, and stars!\nPress R to restart level, N for next level', {
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

    // Check for level management input
    this.handleLevelInput()

    // Check for debug toggle (D key)
    this.handleDebugInput()

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

    // Update orbs
    this.orbs.forEach((orb) => {
      orb.update(deltaTime)

      // Check if player can interact with orb
      if (!orb.isCollected) {
        const playerPos = this.player.getPosition()
        const canInteract = orb.canInteract(playerPos)
        const playerBounds = this.player.getBounds()
        const orbBounds = orb.getBounds()
        const collision = this.checkCollision(playerBounds, orbBounds)

        // Debug logging
        if (canInteract || collision) {
          console.warn('Orb interaction debug:', {
            playerPos,
            orbPos: orb.getPosition(),
            canInteract,
            collision,
            playerBounds: { x: playerBounds.x, y: playerBounds.y, w: playerBounds.width, h: playerBounds.height },
            orbBounds: { x: orbBounds.x, y: orbBounds.y, w: orbBounds.width, h: orbBounds.height },
          })
        }

        if (canInteract && collision) {
          console.warn('Collecting orb!')
          orb.collect()
          this.loadTargetLevel(orb.targetLevel)
          this.camera.shake(5, 200)
        }
      }
    })

    // Update star twinkling effect
    this.stars.forEach((star: any) => {
      const data = star.userData
      if (data) {
        const time = Date.now() * data.twinkleSpeed
        star.alpha = data.baseAlpha + Math.sin(time) * 0.3
      }
    })

    // Subtle parallax movement
    this.parallaxContainer.x = -this.player.sprite.x * 0.1

    // Update debug info
    const playerBounds = this.player.getBounds()
    this.debugText.text = `FPS: ${Math.round(this.app.ticker.FPS)}
Position: (${Math.round(this.player.sprite.x)}, ${Math.round(this.player.sprite.y)})
Velocity: (${this.player.velocity.x.toFixed(1)}, ${this.player.velocity.y.toFixed(1)})
On Ground: ${this.player.isOnGround}
Player Bounds: (${Math.round(playerBounds.x)}, ${Math.round(playerBounds.y)}, ${Math.round(playerBounds.width)}, ${Math.round(playerBounds.height)})
Platforms: ${this.platforms.length}
Level: ${this.levelManager.getCurrentLevelIndex() + 1}/${this.levelManager.getTotalLevels()}
Controls: ${this.getActiveControls()}
Debug Mode: ${this.showDebugBoxes ? 'ON' : 'OFF'} (Press Q to toggle)`
  }

  private previousInputState = {
    restart: false,
    next: false,
    debug: false,
  }

  private handleLevelInput(): void {
    const input = this.game.input

    // Handle restart key (R) - only trigger on key press, not hold
    if (input.restart && !this.previousInputState.restart) {
      this.restartLevel()
    }

    // Handle next level key (N) - only trigger on key press, not hold
    if (input.next && !this.previousInputState.next) {
      this.loadNextLevel()
    }

    // Update previous state for next frame
    this.previousInputState.restart = input.restart
    this.previousInputState.next = input.next
  }

  private handleDebugInput(): void {
    const input = this.game.input

    // Handle debug toggle (Q key) - only trigger on key press, not hold
    if (input.debug && !this.previousInputState.debug) {
      this.toggleDebugMode()
    }

    // Update previous state for next frame
    this.previousInputState.debug = input.debug
  }

  private toggleDebugMode(): void {
    this.showDebugBoxes = !this.showDebugBoxes

    // Toggle player debug
    this.player.toggleDebug()

    // Toggle platform debug boxes
    this.platformDebugBoxes.forEach((debugBox) => {
      debugBox.visible = this.showDebugBoxes
    })
  }

  private async restartLevel(): Promise<void> {
    const currentLevel = this.levelManager.getCurrentLevel()
    if (currentLevel) {
      await this.setupLevel(currentLevel)
      this.score = 0
      this.scoreText.text = 'Score: 0'
    }
  }

  private async loadNextLevel(): Promise<void> {
    try {
      const nextLevel = await this.levelManager.loadNextLevel()
      if (nextLevel) {
        await this.setupLevel(nextLevel)
        this.score = 0
        this.scoreText.text = 'Score: 0'
        this.levelManager.saveProgress()
      }
    }
    catch {
      console.warn('No more levels available')
    }
  }

  private async loadPreviousLevel(): Promise<void> {
    try {
      const prevLevel = await this.levelManager.loadPreviousLevel()
      if (prevLevel) {
        await this.setupLevel(prevLevel)
        this.score = 0
        this.scoreText.text = 'Score: 0'
      }
    }
    catch {
      console.warn('Already at first level')
    }
  }

  private async loadTargetLevel(levelNumber: number): Promise<void> {
    try {
      // Convert level number to index (level 2 = index 1)
      const levelIndex = levelNumber - 1
      const targetLevel = await this.levelManager.loadLevelByIndex(levelIndex)
      if (targetLevel) {
        await this.setupLevel(targetLevel)
        this.score = 0
        this.scoreText.text = 'Score: 0'
        this.levelManager.saveProgress()
      }
    }
    catch (error) {
      console.warn(`Failed to load level ${levelNumber}:`, error)
    }
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
