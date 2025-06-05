import * as PIXI from 'pixi.js'

export abstract class Scene {
  public container = new PIXI.Container()
  protected app: PIXI.Application

  constructor(app: PIXI.Application) {
    this.app = app
  }

  abstract init(): Promise<void> | void
  abstract update(deltaTime: number): void
  abstract destroy(): Promise<void> | void

  // Optional resize handler
  resize?(width: number, height: number): void
}
