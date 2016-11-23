import { Credentials, SQS } from 'aws-sdk'
import { expect } from 'chai'
import { Queue } from '../src/queue'
import * as Bluebird from 'bluebird'

const TestEndpoint = 'http://yopa/queue/test'

describe('Queue', () => {
  let sqs : SQS

  async function getNextSqsItem () : Promise<any> {
    let response = await sqs.receiveMessage({
      QueueUrl: TestEndpoint,
      MaxNumberOfMessages: 1
    }).promise()

    let message = response.Messages[0]
    let item = JSON.parse(message.Body)

    await sqs.deleteMessage({
      QueueUrl: TestEndpoint,
      ReceiptHandle: message.ReceiptHandle
    }).promise()

    return item
  }

  before(async function () {
    sqs = new SQS({
      region: 'yopa-local',
      credentials: new Credentials({
        accessKeyId: 'x',
        secretAccessKey: 'x'
      })
    })
  })

  beforeEach(async function () {
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

      item = await getNextSqsItem()
    })

    it('should correctly post the item', () => {
      expect(item).to.have.property('test', true)
      expect(item).to.have.property('lol', '123')
    })
  })

  describe('when processing items', () => {
    let items : any[] = []
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
          done()
        }
      })
    })

    it('process the items in the queue', () => {
      expect(items).to.containSubset(['gretchen', 'actress'])
    })

    describe('when stopping the queue', () => {
      before(() => {
        return queue.stopProcessing()
      })

      it('should stop consuming the queue', async function () {
        await queue.push('tdb')

        await Bluebird.delay(100)

        let item = await getNextSqsItem()

        expect(item).to.equal('tdb')
      })
    })
  })
})

