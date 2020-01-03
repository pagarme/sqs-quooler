import Bluebird from 'bluebird'

export default class Signal {
  promise: Promise<void>
  triggerFn: () => void

  constructor () {
    this.promise = new Bluebird((resolve) => {
      this.triggerFn = resolve
    })
  }

  trigger (): void {
    this.triggerFn()
  }
}
