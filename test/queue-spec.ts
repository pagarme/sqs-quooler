import { Credentials, SQS } from 'aws-sdk'
import * as chai from 'chai'
import { Queue } from '../src/queue'

const expect = chai.expect
const TestEndpoint = 'http://yopa/queue/test'

chai.use(require('chai-subset'))

describe('Queue', () => {
  let sqs : SQS

  before(async function () {
    sqs = new SQS({
      region: 'yopa-local',
      credentials: new Credentials({
        accessKeyId: 'x',
        secretAccessKey: 'x'
      })
    })

    await sqs.purgeQueue({
      QueueUrl: TestEndpoint
    }).promise()
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

    before(async function () {
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
    let items = []
    let queue : Queue<string>

    before(async function () : Promise<void> {
      queue = new Queue<any>({
        sqs: sqs,
        endpoint: TestEndpoint,
        concurrency: 1
      })

      await queue.push('gretchen')
      await queue.push('actress')
    })

    before(done => {
      queue.startProcessing(item => {
        items.push(item)

        if (items.length >= 2) {
          queue.stopProcessing()
          done()
        }
      })
    })

    it('process the items in the queue', () => {
      expect(items).to.containSubset(['gretchen', 'actress'])
    })
  })
})

