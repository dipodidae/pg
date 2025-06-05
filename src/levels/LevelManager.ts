import type { LevelData } from './types'
import type { Game } from '@/core/Game'
import { SVGLevelLoader } from './SVGLevelLoader'

export class LevelManager {
  private game: Game
  private currentLevel: LevelData | null = null
  private levelIndex: number = 0
  private availableLevels: string[] = []

  constructor(game: Game) {
    this.game = game
    this.initializeLevels()
  }

  private initializeLevels(): void {
    // Define available level files
    this.availableLevels = [
      '/levels/level1.svg',
      '/levels/level2.svg',
      '/levels/level3.svg',
    ]
  }

  async loadLevel(levelPath: string): Promise<LevelData> {
    try {
      console.log(`Loading level: ${levelPath}`)
      const levelData = await SVGLevelLoader.loadLevel(levelPath)
      this.currentLevel = levelData
      return levelData
    }
    catch (error) {
      console.error('Failed to load level:', error)
      // Fallback to generated level
      return this.createFallbackLevel()
    }
  }

  async loadLevelByIndex(index: number): Promise<LevelData> {
    if (index < 0 || index >= this.availableLevels.length) {
      throw new Error(`Level index ${index} out of bounds`)
    }

    this.levelIndex = index
    return this.loadLevel(this.availableLevels[index])
  }

  async loadNextLevel(): Promise<LevelData | null> {
    if (this.levelIndex + 1 >= this.availableLevels.length) {
      return null // No more levels
    }

    this.levelIndex++
    return this.loadLevelByIndex(this.levelIndex)
  }

  async loadPreviousLevel(): Promise<LevelData | null> {
    if (this.levelIndex <= 0) {
      return null // Already at first level
    }

    this.levelIndex--
    return this.loadLevelByIndex(this.levelIndex)
  }

  getCurrentLevel(): LevelData | null {
    return this.currentLevel
  }

  getCurrentLevelIndex(): number {
    return this.levelIndex
  }

  getTotalLevels(): number {
    return this.availableLevels.length
  }

  private createFallbackLevel(): LevelData {
    // Create a simple fallback level when SVG loading fails
    return {
      name: 'Fallback Level',
      width: 1600,
      height: 800,
      playerStart: { x: 100, y: 500 },
      platforms: [
        { x: 0, y: 740, width: 1600, height: 60 }, // Ground
        { x: 200, y: 600, width: 150, height: 20 },
        { x: 400, y: 500, width: 120, height: 20 },
        { x: 600, y: 400, width: 100, height: 20 },
        { x: 800, y: 350, width: 80, height: 20 },
      ],
      collectibles: [
        { x: 275, y: 580, type: 'coin' },
        { x: 325, y: 580, type: 'coin' },
        { x: 460, y: 470, type: 'gem' },
        { x: 650, y: 360, type: 'star' },
        { x: 840, y: 320, type: 'coin' },
      ],
      background: {
        color: '#1a1a2e',
        stars: true,
      },
    }
  }

  /**
   * Save current level progress
   */
  saveProgress(): void {
    const progress = {
      currentLevel: this.levelIndex,
      unlockedLevels: this.levelIndex + 1,
    }
    localStorage.setItem('platformer-progress', JSON.stringify(progress))
  }

  /**
   * Load saved progress
   */
  loadProgress(): void {
    const savedProgress = localStorage.getItem('platformer-progress')
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress)
        this.levelIndex = Math.max(0, Math.min(progress.currentLevel || 0, this.availableLevels.length - 1))
      }
      catch (error) {
        console.warn('Failed to load progress:', error)
      }
    }
  }
}
