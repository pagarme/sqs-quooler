import * as Bluebird from 'bluebird'

export class Signal {
  private triggerFn: (x?: any) => void

  promise: PromiseLike<void>

  constructor() {
    let self = this

    this.promise = new Bluebird((resolve) => {
      self.triggerFn = resolve
    })
  }

  trigger() {
    this.triggerFn()
  }
}

