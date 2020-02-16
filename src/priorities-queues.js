import Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import CustomError from './custom-error'
import Signal from './signal'

export default class PrioritiesQueues extends EventEmitter {
  constructor (options) {
    super()

    if (!options) {
      throw new CustomError({
        type: 'missing parameter',
        message: 'This method requires an options as the first argument',
      })
    }

    if (!options.sqs) {
      throw new CustomError({
        type: 'missing parameter',
        message: 'This method requires options.sqs',
      })
    }

    if (!options.queues || !Object.keys(options.queues).length) {
      throw new CustomError({
        type: 'missing parameter',
        message: 'This method requires options.queues',
      })
    }

    if (!options.priorities || !options.priorities.length) {
      throw new CustomError({
        type: 'missing parameter',
        message: 'This method requires options.priorities',
      })
    }

    options.priorities.forEach((queueName) => {
      if (!options.queues[queueName]) {
        throw new CustomError({
          type: 'invalid parameter',
          message: 'There are queues at priorities list that are not at the queues list',
        })
      }
    })

    this.options = options
    this.customPriorities = [].concat(options.priorities)
    this.prioritiesCount = options.priorities
      .reduce((result, priority) => {
        // eslint-disable-next-line no-param-reassign
        result[priority] = 0
        return result
      }, {})

    this.maxPriorityRetries = options.maxPriorityRetries
  }

  async push (item, queue, parameters = {}) {
    if (!queue) {
      throw new CustomError({
        type: 'missing parameter',
        message: 'This method requires a queue name as the second argument',
      })
    }

    if (!this.options.queues[queue]) {
      throw new CustomError({
        type: 'invalid parameter',
        message: 'Invalid queue name provided, please select a valid queue',
      })
    }

    return this.options.sqs
      .sendMessage(Object.assign({}, {
        QueueUrl: this.options.queues[queue],
        MessageBody: JSON.stringify(item),
      }, parameters))
      .promise()
  }

  async remove (message, queue) {
    if (!message) {
      throw new CustomError({
        type: 'missing parameter',
        message: 'This method requires a message as the first argument',
      })
    }

    if (!queue) {
      throw new CustomError({
        type: 'missing parameter',
        message: 'This method requires a queue name as the second argument',
      })
    }

    if (!message.ReceiptHandle) {
      throw new CustomError({
        type: 'invalid parameter',
        message: 'Invalid message provided, the message must include ReceiptHandle attribute',
      })
    }

    if (!this.options.queues[queue]) {
      throw new CustomError({
        type: 'invalid parameter',
        message: 'Invalid queue name provided, please select a valid queue',
      })
    }

    return this.options.sqs
      .deleteMessage({
        QueueUrl: this.options.queues[queue],
        ReceiptHandle: message.ReceiptHandle,
      })
      .promise()
  }

  async changeMessageVisibility (parameters = {}, queue) {
    if (!parameters) {
      throw new CustomError({
        type: 'missing parameter',
        message: 'This method requires a parameters object as the first argument',
      })
    }

    if (!queue) {
      throw new CustomError({
        type: 'missing parameter',
        message: 'This method requires a queue name as the second argument',
      })
    }

    if (!this.options.queues[queue]) {
      throw new CustomError({
        type: 'invalid parameter',
        message: 'Invalid queue name provided, please select a valid queue',
      })
    }

    return this.options.sqs
      .changeMessageVisibility(Object.assign({}, {
        QueueUrl: this.options.queues[queue],
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

        return self.remove(message, message.queue)
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

      const runAgain = () => {
        if (options.oneShot) {
          return Bluebird.resolve()
        }

        self.customPriorities = [].concat(self.options.priorities)

        return pollItems()
      }

      const handleCriticalError = (err) => {
        self.emit('error', err)

        return Bluebird.delay(100).then(pollItems)
      }

      const getMessages = (priorityIndex = 0) => {
        const queue = self.customPriorities[priorityIndex]

        if (!queue) {
          return []
        }

        return Bluebird.resolve()
          .then(() => self.options.sqs
            .receiveMessage({
              QueueUrl: self.options.queues[queue],
              MaxNumberOfMessages: self.options.concurrency,
            })
            .promise())
          .get('Messages')
          .then(coerce)
          .then((itens) => {
            if (itens.length) {
              return itens.map(item => Object.assign({}, item, { queue }))
            }

            return getMessages(priorityIndex + 1)
          })
      }

      function checkPriorities () {
        let firstCustomPriority = self.customPriorities[0]

        if (
          self.prioritiesCount[firstCustomPriority] >= self.maxPriorityRetries
        ) {
          self.customPriorities = self.customPriorities
            .concat(self.customPriorities.shift())
          self.prioritiesCount[firstCustomPriority] = 0
        }

        [firstCustomPriority] = self.customPriorities

        if (
          self.prioritiesCount[firstCustomPriority] >= self.maxPriorityRetries
        ) {
          checkPriorities()
        }
      }

      if (self.maxPriorityRetries) {
        checkPriorities()
      }

      const firstCustomPriority = self.customPriorities[0]
      self.prioritiesCount[firstCustomPriority] += 1

      return getMessages()
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
