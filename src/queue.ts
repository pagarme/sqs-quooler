import { SQS } from 'aws-sdk'
import * as Bluebird from 'bluebird'
import { EventEmitter } from 'events'
import { Signal } from './signal'

export interface QueueOptions {
  sqs: SQS,
  endpoint: string,
  concurrency?: number
}

export interface ProcessOptions {
  oneShot?: boolean
}

export class Queue<TItem> extends EventEmitter {
  private options: QueueOptions
  private running: boolean
  private stopped: Signal

  constructor (options : QueueOptions) {
    super()

    this.options = options
  }

  async push (item : TItem) : Promise<void> {
    await this.options.sqs.sendMessage({
      QueueUrl: this.options.endpoint,
      MessageBody: JSON.stringify(item)
    }).promise()
  }

  startProcessing (handler : (item : TItem) => any | PromiseLike<any>, options?: ProcessOptions): PromiseLike<void> {
    let self = this

    if (options == null) {
      options = {}
    }

    self.running = true

    return pollItems()

    function pollItems() : PromiseLike<void> {
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
    }

    function processItem (message : any) : PromiseLike<any> {
      let body = <TItem>JSON.parse(message.Body)

      return Bluebird.resolve(body)
        .then(handler)
        .then(deleteMessage)
        .catch(handleError)

      function deleteMessage () : PromiseLike<any> {
        return self.options.sqs.deleteMessage({
          QueueUrl: self.options.endpoint,
          ReceiptHandle: message.ReceiptHandle
        }).promise()
      }

      function handleError (err : Error) {
        self.emit('error', err)
      }
    }

    function coerce (x? : any[]) : any[] {
      return x || []
    }

    function delay (items : any[]) : PromiseLike<void> | void {
      if (items.length == 0) {
        return Bluebird.delay(100)
      }
    }

    function runAgain (items : any[]) : PromiseLike<void> | void {
      if (items.length == 0 && options.oneShot) {
        return
      }

      return pollItems()
    }
  }

  stopProcessing () : PromiseLike<void> {
    let self = this

    if (!this.running) {
      return this.stopped.promise
    }

    this.running = false
    this.stopped = new Signal()

    return this.stopped.promise
  }
}

