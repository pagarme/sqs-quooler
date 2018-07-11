import Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import Signal from './signal'

export default class Queue extends EventEmitter {
  constructor (options) {
    super()

    this.options = options
  }

  async push (item, parameters = {}) {
    await this.options.sqs
      .sendMessage(Object.assign({}, {
        QueueUrl: this.options.endpoint,
        MessageBody: JSON.stringify(item),
      }, parameters))
      .promise()
  }

  async remove (message) {
    await this.options.sqs
      .deleteMessage({
        QueueUrl: this.options.endpoint,
        ReceiptHandle: message.ReceiptHandle,
      })
      .promise()
  }

  startProcessing (handler, options = {}) {
    const self = this

    self.running = true

    const processItem = (message) => {
      const body = JSON.parse(message.Body)

      const deleteMessage = () => {
        if (options.keepMessages) {
          return Bluebird.resolve()
        }

        return self.options.sqs
          .deleteMessage({
            QueueUrl: self.options.endpoint,
            ReceiptHandle: message.ReceiptHandle,
          })
          .promise()
      }

      const handleError = (err) => {
        self.emit('error', err)
      }

      return Bluebird.resolve([body, message])
        .spread(handler)
        .then(deleteMessage)
        .catch(handleError)
    }

    const coerce = x => x || []

    const delay = (items) => {
      if (items.length === 0) {
        return Bluebird.delay(100)
      }

      return Bluebird.resolve()
    }

    const pollItems = () => {
      if (!self.running) {
        self.stopped.trigger()

        return Promise.resolve()
      }

      const runAgain = (items) => {
        if (items.length < self.options.concurrency && options.oneShot) {
          return Bluebird.resolve()
        }

        return pollItems()
      }

      const handleCriticalError = (err) => {
        self.emit('error', err)

        return Bluebird.delay(100).then(pollItems)
      }

      return Bluebird.resolve(self.options.sqs
        .receiveMessage({
          QueueUrl: self.options.endpoint,
          MaxNumberOfMessages: self.options.concurrency,
        })
        .promise())
        .get('Messages')
        .then(coerce)
        .map(processItem)
        .tap(delay)
        .then(runAgain)
        .catch(handleCriticalError)
    }

    return pollItems()
  }

  stopProcessing () {
    if (!this.running) {
      return this.stopped.promise
    }

    this.running = false
    this.stopped = new Signal()

    return this.stopped.promise
  }
}
