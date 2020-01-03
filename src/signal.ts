import Bluebird from 'bluebird'

export default class Signal {
  promise: Promise<void>
  triggerFn: () => void
  
  constructor () {
    const self = this

    this.promise = new Bluebird((resolve) => {
      self.triggerFn = resolve
    })
  }

  trigger () {
    this.triggerFn()
  }
}
