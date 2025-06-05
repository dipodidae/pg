import type { BackgroundData, CollectibleData, EnemyData, LevelData, LevelOrbData, Platform, Vector2 } from './types'

export class SVGLevelLoader {
  /**
   * Load and parse an SVG level file
   * SVG elements should use classes to identify their purpose:
   * - class="platform" for platforms
   * - class="collectible-coin", "collectible-gem", "collectible-star" for collectibles
   * - class="enemy-goomba", "enemy-spike", etc. for enemies
   * - class="orb" or "level-orb" for level progression orbs
   * - class="player-start" for player starting position
   * - class="background" for background configuration
   */
  static async loadLevel(svgPath: string): Promise<LevelData> {
    try {
      const response = await fetch(svgPath)
      const svgText = await response.text()

      // Parse SVG using DOMParser
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
      const svgElement = svgDoc.querySelector('svg')

      if (!svgElement) {
        throw new Error('Invalid SVG file - no root SVG element found')
      }

      // Get level dimensions from SVG viewBox or width/height
      const { width, height } = this.extractLevelDimensions(svgElement)

      // Extract level elements by class
      const platforms = this.extractPlatforms(svgDoc)
      const collectibles = this.extractCollectibles(svgDoc)
      const enemies = this.extractEnemies(svgDoc)
      const orbs = this.extractOrbs(svgDoc)
      const playerStart = this.extractPlayerStart(svgDoc) || { x: 100, y: 500 }
      const background = this.extractBackground(svgDoc)

      const levelName = this.extractLevelName(svgPath)

      return {
        name: levelName,
        width,
        height,
        playerStart,
        platforms,
        collectibles,
        enemies,
        orbs,
        background,
      }
    }
    catch (error) {
      console.error('Failed to load SVG level:', error)
      throw new Error(`Failed to load level from ${svgPath}: ${error}`)
    }
  }

  private static extractLevelDimensions(svgElement: SVGSVGElement): { width: number, height: number } {
    // Try viewBox first
    const viewBox = svgElement.getAttribute('viewBox')
    if (viewBox) {
      const [, , width, height] = viewBox.split(' ').map(Number)
      return { width, height }
    }

    // Fallback to width/height attributes
    const width = Number.parseFloat(svgElement.getAttribute('width') || '1024')
    const height = Number.parseFloat(svgElement.getAttribute('height') || '768')

    return { width, height }
  }

  private static extractPlatforms(svgDoc: Document): Platform[] {
    const platforms: Platform[] = []
    const platformElements = svgDoc.querySelectorAll('.platform, [class*="platform"]')

    platformElements.forEach((element) => {
      const platform = this.convertElementToPlatform(element as SVGElement)
      if (platform) {
        platforms.push(platform)
      }
    })

    return platforms
  }

  private static convertElementToPlatform(element: SVGElement): Platform | null {
    const tagName = element.tagName.toLowerCase()

    if (tagName === 'rect') {
      const x = Number.parseFloat(element.getAttribute('x') || '0')
      const y = Number.parseFloat(element.getAttribute('y') || '0')
      const width = Number.parseFloat(element.getAttribute('width') || '0')
      const height = Number.parseFloat(element.getAttribute('height') || '0')

      // Determine platform type from class
      const className = element.getAttribute('class') || ''
      let type: Platform['type'] = 'normal'
      if (className.includes('moving'))
        type = 'moving'
      else if (className.includes('breakable'))
        type = 'breakable'
      else if (className.includes('ice'))
        type = 'ice'

      return { x, y, width, height, type }
    }

    // Could extend to support other shapes like paths, polygons, etc.
    return null
  }

  private static extractCollectibles(svgDoc: Document): CollectibleData[] {
    const collectibles: CollectibleData[] = []
    const collectibleElements = svgDoc.querySelectorAll('[class*="collectible"]')

    collectibleElements.forEach((element) => {
      const collectible = this.convertElementToCollectible(element as SVGElement)
      if (collectible) {
        collectibles.push(collectible)
      }
    })

    return collectibles
  }

  private static convertElementToCollectible(element: SVGElement): CollectibleData | null {
    const className = element.getAttribute('class') || ''
    const position = this.getElementPosition(element)

    if (!position)
      return null

    let type: CollectibleData['type'] = 'coin'
    if (className.includes('gem'))
      type = 'gem'
    else if (className.includes('star'))
      type = 'star'

    return {
      x: position.x,
      y: position.y,
      type,
    }
  }

  private static extractEnemies(svgDoc: Document): EnemyData[] {
    const enemies: EnemyData[] = []
    const enemyElements = svgDoc.querySelectorAll('[class*="enemy"]')

    enemyElements.forEach((element) => {
      const enemy = this.convertElementToEnemy(element as SVGElement)
      if (enemy) {
        enemies.push(enemy)
      }
    })

    return enemies
  }

  private static convertElementToEnemy(element: SVGElement): EnemyData | null {
    const className = element.getAttribute('class') || ''
    const position = this.getElementPosition(element)

    if (!position)
      return null

    let type: EnemyData['type'] = 'goomba'
    if (className.includes('spike'))
      type = 'spike'
    else if (className.includes('flying'))
      type = 'flying'

    // Extract patrol distance from data attribute or default
    const patrolDistance = Number.parseFloat(element.getAttribute('data-patrol') || '100')

    return {
      x: position.x,
      y: position.y,
      type,
      patrolDistance,
    }
  }

  private static extractPlayerStart(svgDoc: Document): Vector2 | null {
    const startElement = svgDoc.querySelector('.player-start, [class*="player-start"]')
    if (!startElement)
      return null

    return this.getElementPosition(startElement as SVGElement)
  }

  private static extractBackground(svgDoc: Document): BackgroundData | undefined {
    const backgroundElement = svgDoc.querySelector('.background, [class*="background"]')
    if (!backgroundElement)
      return undefined

    const color = backgroundElement.getAttribute('fill') || undefined
    const starsAttr = backgroundElement.getAttribute('data-stars')
    const stars = starsAttr ? starsAttr.toLowerCase() === 'true' : undefined

    // Could extend to extract gradient information
    return { color, stars }
  }

  private static extractOrbs(svgDoc: Document): LevelOrbData[] {
    const orbs: LevelOrbData[] = []
    const orbElements = svgDoc.querySelectorAll('.orb, .level-orb, [class*="orb"]')

    orbElements.forEach((element) => {
      const orb = this.convertElementToOrb(element as SVGElement)
      if (orb) {
        orbs.push(orb)
      }
    })

    return orbs
  }

  private static convertElementToOrb(element: SVGElement): LevelOrbData | null {
    const position = this.getElementPosition(element)

    if (!position)
      return null

    // Extract target level from data attribute, default to next level (2)
    const targetLevel = Number.parseFloat(element.getAttribute('data-target-level') || '2')

    return {
      x: position.x,
      y: position.y,
      targetLevel,
    }
  }

  private static getElementPosition(element: SVGElement): Vector2 | null {
    const tagName = element.tagName.toLowerCase()

    if (tagName === 'circle') {
      const cx = Number.parseFloat(element.getAttribute('cx') || '0')
      const cy = Number.parseFloat(element.getAttribute('cy') || '0')
      return { x: cx, y: cy }
    }

    if (tagName === 'rect') {
      const x = Number.parseFloat(element.getAttribute('x') || '0')
      const y = Number.parseFloat(element.getAttribute('y') || '0')
      const width = Number.parseFloat(element.getAttribute('width') || '0')
      const height = Number.parseFloat(element.getAttribute('height') || '0')
      // Return center position
      return { x: x + width / 2, y: y + height / 2 }
    }

    // For other elements, try to get transform or x/y attributes
    const x = Number.parseFloat(element.getAttribute('x') || '0')
    const y = Number.parseFloat(element.getAttribute('y') || '0')
    return { x, y }
  }

  private static extractLevelName(svgPath: string): string {
    const filename = svgPath.split('/').pop() || 'unknown'
    return filename.replace('.svg', '')
  }

  /**
   * Create a sample SVG level file for reference
   */
  static createSampleLevel(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1600" height="800" viewBox="0 0 1600 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background configuration -->
  <rect class="background" fill="#1a1a2e" data-stars="true" width="100%" height="100%"/>

  <!-- Player starting position -->
  <circle class="player-start" cx="100" cy="500" r="16" fill="#4ecdc4" opacity="0.5"/>

  <!-- Platforms -->
  <rect class="platform" x="0" y="740" width="1600" height="60" fill="#95a5a6"/>
  <rect class="platform" x="200" y="600" width="150" height="20" fill="#95a5a6"/>
  <rect class="platform moving" x="400" y="500" width="120" height="20" fill="#3498db"/>
  <rect class="platform ice" x="600" y="400" width="100" height="20" fill="#74b9ff"/>
  <rect class="platform breakable" x="800" y="350" width="80" height="20" fill="#e17055"/>

  <!-- Collectibles -->
  <circle class="collectible-coin" cx="275" cy="580" r="12" fill="#ffd700"/>
  <circle class="collectible-coin" cx="325" cy="580" r="12" fill="#ffd700"/>
  <circle class="collectible-gem" cx="460" cy="470" r="10" fill="#9c27b0"/>
  <circle class="collectible-star" cx="650" cy="360" r="15" fill="#ffeb3b"/>
  <circle class="collectible-coin" cx="840" cy="320" r="12" fill="#ffd700"/>

  <!-- Enemies -->
  <circle class="enemy-goomba" cx="500" cy="700" r="16" fill="#8b4513" data-patrol="100"/>
  <circle class="enemy-spike" cx="300" cy="600" r="12" fill="#ff4757"/>
  <circle class="enemy-flying" cx="700" cy="300" r="14" fill="#5f27cd" data-patrol="150"/>
</svg>`
  }

  /**
   * Validate SVG level file structure
   */
  static validateLevel(svgText: string): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    try {
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
      const svgElement = svgDoc.querySelector('svg')

      if (!svgElement) {
        errors.push('No root SVG element found')
        return { valid: false, errors }
      }

      // Check for player start
      const playerStart = svgDoc.querySelector('.player-start, [class*="player-start"]')
      if (!playerStart) {
        errors.push('No player starting position found (class="player-start")')
      }

      // Check for at least one platform
      const platforms = svgDoc.querySelectorAll('.platform, [class*="platform"]')
      if (platforms.length === 0) {
        errors.push('No platforms found (class="platform")')
      }

      // Validate dimensions
      const { width, height } = this.extractLevelDimensions(svgElement)
      if (width <= 0 || height <= 0) {
        errors.push('Invalid level dimensions')
      }

      // Check for background
      const background = svgDoc.querySelector('.background, [class*="background"]')
      if (!background) {
        console.warn('No background element found - using default')
      }

      return { valid: errors.length === 0, errors }
    }
    catch (error) {
      errors.push(`Parse error: ${error}`)
      return { valid: false, errors }
    }
  }

  /**
   * Create a blank level template
   */
  static createBlankLevel(width: number = 1600, height: number = 800): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect class="background" fill="#1a1a2e" data-stars="true" width="100%" height="100%"/>

  <!-- Player starting position -->
  <circle class="player-start" cx="100" cy="${height - 200}" r="16" fill="#4ecdc4" opacity="0.5"/>

  <!-- Ground platform -->
  <rect class="platform" x="0" y="${height - 60}" width="${width}" height="60" fill="#95a5a6"/>

  <!-- Add your platforms, collectibles, and enemies here -->

</svg>`
  }

  /**
   * Extract level metadata for level selection
   */
  static async getLevelMetadata(svgPath: string): Promise<{
    name: string
    difficulty?: string
    description?: string
    collectibleCount: number
    platformCount: number
  }> {
    try {
      const response = await fetch(svgPath)
      const svgText = await response.text()
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')

      const collectibles = svgDoc.querySelectorAll('[class*="collectible"]')
      const platforms = svgDoc.querySelectorAll('[class*="platform"]')

      // Try to extract metadata from SVG title or desc elements
      const title = svgDoc.querySelector('title')?.textContent || this.extractLevelName(svgPath)
      const desc = svgDoc.querySelector('desc')?.textContent

      // Extract difficulty from root SVG data attribute
      const svgElement = svgDoc.querySelector('svg')
      const difficulty = svgElement?.getAttribute('data-difficulty')

      return {
        name: title,
        difficulty: difficulty || undefined,
        description: desc || undefined,
        collectibleCount: collectibles.length,
        platformCount: platforms.length,
      }
    }
    catch (error) {
      console.error('Failed to get level metadata:', error)
      return {
        name: this.extractLevelName(svgPath),
        collectibleCount: 0,
        platformCount: 0,
      }
    }
  }
}
