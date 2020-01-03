import Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import { SQS } from 'aws-sdk'
// eslint-disable-next-line import/no-unresolved,import/extensions
import Signal from './signal'

export default class Queue extends EventEmitter {
  running: boolean
  stopped

  constructor (public options: {
    sqs: SQS;
    endpoint: string;
    concurrency: number;
  }) {
    super()
  }

  async push (item: { [key: string]: any }, parameters = {}) {
    await this.options.sqs
      .sendMessage({
        QueueUrl: this.options.endpoint,
        MessageBody: JSON.stringify(item),
        ...parameters,
      })
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

  async changeMessageVisibility (parameters: {
    ReceiptHandle: string;
    VisibilityTimeout: number;
  }) {
    await this.options.sqs
      .changeMessageVisibility({
        QueueUrl: this.options.endpoint,
        ...parameters,
      })
      .promise()
  }

  startProcessing (
    handler,
    options: {
      keepMessages?: boolean;
      oneShot?: boolean;
    } = {}
  ) {
    this.running = true

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

        return this.options.sqs
          .deleteMessage({
            QueueUrl: this.options.endpoint,
            ReceiptHandle: message.ReceiptHandle,
          })
          .promise()
      }

      const handleError = (err) => {
        this.emit('error', err)
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
      if (!this.running) {
        this.stopped.trigger()

        return Bluebird.resolve()
      }

      const runAgain = (items) => {
        if (items.length < this.options.concurrency && options.oneShot) {
          return Bluebird.resolve()
        }

        return pollItems()
      }

      const handleCriticalError = (err) => {
        this.emit('error', err)

        return Bluebird.delay(100).then(pollItems)
      }

      return Bluebird.resolve(this.options.sqs
        .receiveMessage({
          QueueUrl: this.options.endpoint,
          MaxNumberOfMessages: this.options.concurrency,
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
