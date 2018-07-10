import { SQS } from 'aws-sdk'
import Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import { Signal } from './signal'

export class Queue extends EventEmitter {
  constructor (options) {
    super()

    this.options = options
  }

  async push (item, parameters = {}) {
    await this.options.sqs.sendMessage(
      Object.assign({}, {
        QueueUrl: this.options.endpoint,
        MessageBody: JSON.stringify(item)
      }, parameters)
    ).promise()
  }

  async remove (message) {
    await this.options.sqs.deleteMessage({
      QueueUrl: this.options.endpoint,
      ReceiptHandle: message.ReceiptHandle
    }).promise()
  }

  startProcessing (handler, options) {
    const self = this

    if (options == null) {
      options = {}
    }

    self.running = true

    return pollItems()

    function pollItems() {
      if (!self.running) {
        self.stopped.trigger()

        return Promise.resolve()
      }

      return Bluebird.resolve(self.options.sqs.receiveMessage({
        QueueUrl: self.options.endpoint,
        MaxNumberOfMessages: self.options.concurrency
      }).promise())
        .get('Messages')
        .then(coerce)
        .map(processItem)
        .tap(delay)
        .then(runAgain)
        .catch(handleCriticalError)
    }


    function processItem (message) {
      const body = JSON.parse(message.Body)

      return Bluebird.resolve([body, message])
        .spread(handler)
        .then(deleteMessage)
        .catch(handleError)

      function deleteMessage () {
        if (options.keepMessages) {
          return
        }

        return self.options.sqs.deleteMessage({
          QueueUrl: self.options.endpoint,
          ReceiptHandle: message.ReceiptHandle
        }).promise()
      }

      function handleError (err) {
        self.emit('error', err)
      }
    }

    function coerce (x) {
      return x || []
    }

    function delay (items) {
      if (items.length == 0) {
        return Bluebird.delay(100)
      }
    }

    function runAgain (items) {
      if (items.length < self.options.concurrency && options.oneShot) {
        return
      }

      return pollItems()
    }

    function handleCriticalError (err) {
      self.emit('error', err)

      return Bluebird.delay(100).then(pollItems)
    }
  }

  stopProcessing () {
    const self = this

    if (!this.running) {
      return this.stopped.promise
    }

    this.running = false
    this.stopped = new Signal()

    return this.stopped.promise
  }
}
