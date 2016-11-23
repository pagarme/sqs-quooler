import { SQS } from 'aws-sdk'

export interface QueueOptions {
  sqs: SQS,
  endpoint: string,
  concurrency?: number
}

export class Queue<TItem> {
  private options : QueueOptions

  constructor (options : QueueOptions) {
    this.options = options
  }

  async push (item : TItem) : Promise<void> {
    await this.options.sqs.sendMessage({
      QueueUrl: this.options.endpoint,
      MessageBody: JSON.stringify(item)
    }).promise()
  }
}

