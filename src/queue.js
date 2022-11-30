import Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import Signal from './signal'

const MAX_SQS_CONCURRENCY = 10

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

  async changeMessageVisibility (parameters = {}) {
    await this.options.sqs
      .changeMessageVisibility(Object.assign({}, {
        QueueUrl: this.options.endpoint,
      }, parameters))
      .promise()
  }

  startProcessing (handler, options = {}) {
    const self = this

    self.running = true

    const processItem = (message) => {
      let body = ''
      try {
        body = JSON.parse(message.Body)
      } catch (e) {
        body = message.Body
      }

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

    const receiveMessages = (messagesResult = [], remainingCount = self.options.concurrency) => {
      const maxNumberOfMessages = remainingCount > MAX_SQS_CONCURRENCY
        ? MAX_SQS_CONCURRENCY
        : remainingCount

      return Bluebird.resolve(self.options.sqs.receiveMessage({
          QueueUrl: self.options.endpoint,
          MaxNumberOfMessages: maxNumberOfMessages,
          MessageAttributeNames: options.messageAttributeNames || ['All'],
          AttributeNames: options.attributeNames || ['All'],
        }).promise())
        .get('Messages')
        .then(coerce)
        .then((messages) => {
          const isMaxNumberOfMessages = messages.length === maxNumberOfMessages

          messagesResult = messagesResult.concat(messages)

          const isLessThenConcurrency = messagesResult.length < self.options.concurrency

          if (isMaxNumberOfMessages && isLessThenConcurrency) {
            return receiveMessages(messagesResult, remainingCount - messages.length)
          }

          return messagesResult
        })
    }

    const pollItems = () => {
      if (!self.running) {
        self.stopped.trigger()

        return Promise.resolve()
      }

      const runAgain = (items) => {
        if (options.oneShot) {
          if (items.length < self.options.concurrency) {
            return Bluebird.resolve()
          }

          return pollItems()
        }

        // Async call without return to avoid memory leak
        pollItems()
        return Bluebird.resolve()
      }

      const handleCriticalError = (err) => {
        self.emit('error', err)

        return Bluebird.delay(100).then(pollItems)
      }

      return receiveMessages()
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

  async purge () {
    await this.options.sqs
      .purgeQueue({
        QueueUrl: this.options.endpoint,
      }).promise()
  }
}
