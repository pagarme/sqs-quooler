import { SQS } from 'aws-sdk'
import { EventEmitter } from 'events'
import Promise = require('bluebird')

export interface QueueOptions {
  sqs: SQS,
  endpoint: string,
  concurrency?: number
}

export class Queue<TItem> extends EventEmitter {
  private options : QueueOptions

  constructor (options : QueueOptions) {
    super()

    this.options = options
  }

  async push (item : TItem) {
    await this.options.sqs.sendMessage({
      QueueUrl: this.options.endpoint,
      MessageBody: JSON.stringify(item)
    }).promise()
  }

  startProcessing (handler : (item : TItem) => any | Promise<any>) {
    let self = this

    pollItems()

    function pollItems() : Promise<any> {
      return Promise.resolve(self.options.sqs.receiveMessage({
        QueueUrl: self.options.endpoint,
        MaxNumberOfMessages: self.options.concurrency
      }).promise())
        .get('Messages')
        .then(coerce)
        .map(processItem)
        .then(delay)
        .then(pollItems)
    }

    function processItem (message) : Promise<any> {
      let body = <TItem>JSON.parse(message.Body)

      return Promise.resolve(body)
        .then(handler)
        .then(deleteMessage)
        .catch(handleError)

      function deleteMessage () : Promise<any> {
        return self.options.sqs.deleteMessage({
          QueueUrl: self.options.endpoint,
          ReceiptHandle: message.ReceiptHandle
        }).promise()
      }

      function handlerError (err) : Promise<void> {
        self.emit('error', err)
      }
    }

    function coerce (x? : any[]) : any[] {
      return x || []
    }

    function delay (items) {
      if (items.length == 0) {
        return Promise.delay(100)
      }
    }
  }

  stopProcessing () {
  }
}

