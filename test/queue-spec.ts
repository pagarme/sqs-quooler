import { Credentials, SQS } from 'aws-sdk'
import { expect } from 'chai'
import { Queue } from '../src/queue'

const TestEndpoint = 'http://yopa/queue/test'

describe('Queue', () => {
  let sqs : SQS

  before(() => {
    sqs = new SQS({
      region: 'yopa-local',
      credentials: new Credentials({
        accessKeyId: 'x',
        secretAccessKey: 'x'
      })
    })
  })

  describe('when instantiating', () => {
    xdescribe('with an SQS instance', () => {
    })

    xdescribe('with an SQS configuration', () => {
    })
  })

  describe('when posting an item', () => {
    let queue : Queue<any>
    let item : any

    before(async function () : Promise<void> {
      queue = new Queue<any>({
        sqs: sqs,
        endpoint: TestEndpoint,
        concurrency: 1
      })

      await queue.push({
        test: true,
        lol: '123'
      })

      let response = await sqs.receiveMessage({
        QueueUrl: TestEndpoint,
        MaxNumberOfMessages: 1
      }).promise()

      let message = response.Messages[0]

      item = JSON.parse(message.Body)

      await sqs.deleteMessage({
        QueueUrl: TestEndpoint,
        ReceiptHandle: message.ReceiptHandle
      }).promise()
    })

    it('should correctly post the item', () => {
      expect(item).to.have.property('test', true)
      expect(item).to.have.property('lol', '123')
    })
  })

  describe('when processing items', () => {

  })
})

