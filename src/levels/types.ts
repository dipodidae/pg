// Level system type definitions
export interface LevelData {
  name: string
  width: number
  height: number
  playerStart: Vector2
  platforms: Platform[]
  collectibles: CollectibleData[]
  orbs?: LevelOrbData[]
  enemies?: EnemyData[]
  background?: BackgroundData
}

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  type?: 'normal' | 'moving' | 'breakable' | 'ice'
}

export interface CollectibleData {
  x: number
  y: number
  type: 'coin' | 'gem' | 'star'
}

export interface LevelOrbData {
  x: number
  y: number
  targetLevel: number
}

export interface EnemyData {
  x: number
  y: number
  type: 'goomba' | 'spike' | 'flying'
  patrolDistance?: number
}

export interface BackgroundData {
  color?: string
  gradient?: string[]
  stars?: boolean
}

export interface Vector2 {
  x: number
  y: number
}
