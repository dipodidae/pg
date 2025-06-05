import * as PIXI from 'pixi.js'

export class ParticleSystem {
  private particles: Particle[] = []
  private container: PIXI.Container

  constructor(container: PIXI.Container) {
    this.container = container
  }

  emit(x: number, y: number, config: ParticleConfig = {}): void {
    const defaults: Required<ParticleConfig> = {
      count: 5,
      color: 0xFFFFFF,
      speed: 2,
      life: 60,
      spread: Math.PI / 4,
      direction: -Math.PI / 2,
      size: 2,
    }

    const cfg = { ...defaults, ...config }

    for (let i = 0; i < cfg.count; i++) {
      const particle = new Particle(x, y, cfg)
      this.particles.push(particle)
      this.container.addChild(particle.sprite)
    }
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.update()

      if (particle.isDead()) {
        this.container.removeChild(particle.sprite)
        particle.destroy()
        this.particles.splice(i, 1)
      }
    }
  }

  emitJumpDust(x: number, y: number): void {
    this.emit(x, y, {
      count: 8,
      color: 0xD4AF37,
      speed: 3,
      life: 30,
      spread: Math.PI / 3,
      direction: Math.PI / 2,
      size: 3,
    })
  }

  emitLandDust(x: number, y: number): void {
    this.emit(x, y, {
      count: 12,
      color: 0x8B7355,
      speed: 4,
      life: 40,
      spread: Math.PI / 2,
      direction: Math.PI / 2,
      size: 2,
    })
  }
}

interface ParticleConfig {
  count?: number
  color?: number
  speed?: number
  life?: number
  spread?: number
  direction?: number
  size?: number
}

class Particle {
  public sprite: PIXI.Graphics
  private vx: number
  private vy: number
  private life: number
  private maxLife: number
  private startAlpha: number = 1

  constructor(x: number, y: number, config: Required<ParticleConfig>) {
    this.life = config.life
    this.maxLife = config.life

    // Create sprite
    this.sprite = new PIXI.Graphics()
    this.sprite.beginFill(config.color)
    this.sprite.drawCircle(0, 0, config.size)
    this.sprite.endFill()

    this.sprite.x = x
    this.sprite.y = y

    // Random velocity within spread
    const angle = config.direction + (Math.random() - 0.5) * config.spread
    const speed = config.speed * (0.5 + Math.random() * 0.5)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
  }

  update(): void {
    this.sprite.x += this.vx
    this.sprite.y += this.vy

    // Add gravity
    this.vy += 0.1

    // Fade out
    this.life--
    const alpha = this.life / this.maxLife
    this.sprite.alpha = alpha * this.startAlpha

    // Scale down
    const scale = 0.5 + (alpha * 0.5)
    this.sprite.scale.set(scale)
  }

  isDead(): boolean {
    return this.life <= 0
  }

  destroy(): void {
    this.sprite.destroy()
  }
}
