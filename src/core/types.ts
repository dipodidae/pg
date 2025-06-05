// Core type definitions for the platformer game
export interface Vector2 {
  x: number
  y: number
}

export interface GameConfig {
  width: number
  height: number
  backgroundColor: number
  gravity: number
  targetFPS: number
}

export interface InputState {
  left: boolean
  right: boolean
  jump: boolean
  [key: string]: boolean
}

export enum GameState {
  LOADING = 'loading',
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
}
