import * as PIXI from 'pixi.js'

export class SpriteGenerator {
  static createPlayerSprite(): PIXI.Graphics {
    const sprite = new PIXI.Graphics()

    // Player body (pixel art style)
    sprite.beginFill(0x4ECDC4) // Teal body
    sprite.drawRect(-12, -16, 24, 32)
    sprite.endFill()

    // Head
    sprite.beginFill(0xFFE66D) // Yellow head
    sprite.drawRect(-10, -28, 20, 16)
    sprite.endFill()

    // Eyes
    sprite.beginFill(0x000000)
    sprite.drawRect(-7, -24, 3, 3)
    sprite.drawRect(4, -24, 3, 3)
    sprite.endFill()

    // Arms
    sprite.beginFill(0xFFE66D)
    sprite.drawRect(-16, -12, 4, 16)
    sprite.drawRect(12, -12, 4, 16)
    sprite.endFill()

    // Legs
    sprite.beginFill(0x4ECDC4)
    sprite.drawRect(-8, 16, 6, 12)
    sprite.drawRect(2, 16, 6, 12)
    sprite.endFill()

    // Feet
    sprite.beginFill(0xFF6B6B) // Red shoes
    sprite.drawRect(-10, 28, 8, 4)
    sprite.drawRect(2, 28, 8, 4)
    sprite.endFill()

    return sprite
  }

  static createPlatformSprite(width: number, height: number): PIXI.Graphics {
    const platform = new PIXI.Graphics()

    // Main platform
    platform.beginFill(0x95A5A6)
    platform.drawRect(0, 0, width, height)
    platform.endFill()

    // Top highlight
    platform.beginFill(0xBDC3C7)
    platform.drawRect(0, 0, width, 4)
    platform.endFill()

    // Side shadows
    platform.beginFill(0x7F8C8D)
    platform.drawRect(width - 4, 4, 4, height - 4)
    platform.endFill()

    return platform
  }

  static createParticle(color: number = 0xFFFFFF): PIXI.Graphics {
    const particle = new PIXI.Graphics()
    particle.beginFill(color)
    particle.drawCircle(0, 0, 2)
    particle.endFill()
    return particle
  }

  static createBackground(width: number, height: number): PIXI.Graphics {
    // Gradient background
    const gradient = new PIXI.Graphics()
    for (let i = 0; i < height; i++) {
      const ratio = i / height
      // Create color manually since PIXI.utils is deprecated
      const red = Math.floor((0.1 + ratio * 0.3) * 255)
      const green = Math.floor((0.1 + ratio * 0.4) * 255)
      const blue = Math.floor((0.2 + ratio * 0.6) * 255)
      const color = (red << 16) | (green << 8) | blue

      gradient.beginFill(color)
      gradient.drawRect(0, i, width, 1)
      gradient.endFill()
    }

    return gradient
  }
}
