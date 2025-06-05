export class SoundManager {
  private context: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private enabled: boolean = true

  constructor() {
    this.initAudioContext()
  }

  private initAudioContext(): void {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    catch {
      this.enabled = false
    }
  }

  async loadSound(name: string, url: string): Promise<void> {
    if (!this.enabled || !this.context)
      return

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer)
      this.sounds.set(name, audioBuffer)
    }
    catch (error) {
      console.warn(`Failed to load sound: ${name}`, error)
    }
  }

  playSound(name: string, volume: number = 1): void {
    if (!this.enabled || !this.context)
      return

    const buffer = this.sounds.get(name)
    if (!buffer)
      return

    const source = this.context.createBufferSource()
    const gainNode = this.context.createGain()

    source.buffer = buffer
    gainNode.gain.value = volume

    source.connect(gainNode)
    gainNode.connect(this.context.destination)

    source.start()
  }

  // Generate simple procedural sounds
  playTone(frequency: number, duration: number = 200, volume: number = 0.1): void {
    if (!this.enabled || !this.context)
      return

    const oscillator = this.context.createOscillator()
    const gainNode = this.context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.context.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'square'

    gainNode.gain.setValueAtTime(volume, this.context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration / 1000)

    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + duration / 1000)
  }

  playJumpSound(): void {
    this.playTone(440, 150, 0.05) // A4 note
  }

  playLandSound(): void {
    this.playTone(220, 100, 0.03) // A3 note
  }

  playCollectSound(): void {
    this.playTone(660, 200, 0.04) // E5 note
  }
}
