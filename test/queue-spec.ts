import * as chai from 'chai'
import * as Bluebird from 'bluebird'
import { Credentials, SQS } from 'aws-sdk'
import { Queue } from '../src/queue'

const expect = chai.expect

chai.use(require('chai-subset'))

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

  describe('when deleting an item', () => {
    let queue : Queue<any>
    let receiveMessageResponse : any

    before(async function () {
      queue = new Queue<any>({
        sqs: sqs,
        endpoint: TestEndpoint,
        concurrency: 1
      })

      await queue.push('mercury')

      let message = await sqs.receiveMessage({
        QueueUrl: TestEndpoint,
        MaxNumberOfMessages: 1
      }).promise().then(result => result.Messages[0])


      await sqs.changeMessageVisibility({
        QueueUrl: TestEndpoint,
        ReceiptHandle: message.ReceiptHandle,
        VisibilityTimeout: 0
      }).promise()

      await queue.remove(message)

      receiveMessageResponse = await sqs.receiveMessage({
        QueueUrl: TestEndpoint,
        MaxNumberOfMessages: 1
      }).promise()
    })

    it('should have no items in the queue', () => {
      console.log(receiveMessageResponse)
      expect(receiveMessageResponse).to.not.have.property('Messages')
    })
  })

  describe('when processing items', () => {
    let startPromise : Bluebird<void>
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
      let result = queue.startProcessing(item => {
        items.push(item)

        if (items.length >= 2) {
          done()
        }
      })

      // This should only be assumed here, as we now that we use bluebird
      // And we only use this in order to inspect the promise state
      startPromise = <Bluebird<void>>result
    })

    it('process the items in the queue', () => {
      expect(items).to.containSubset(['gretchen', 'actress'])
    })

    it('should not resolve promise returned in startProcessing', () => {
      expect(startPromise.isPending()).to.be.true
    })

    describe('when stopping the queue', () => {
      before(() => {
        return queue.stopProcessing()
      })

      it('should resolve promise returned in startProcessing', () => {
        expect(startPromise.isPending()).to.be.false
      })

      it('should stop consuming the queue', async function () {
        await queue.push('tdb')

        await Bluebird.delay(100)

        let item = await getNextSqsItem()

        expect(item).to.equal('tdb')
      })
    })
  })

  describe('when processing items in one shot mode', () => {
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

    before(() => {
      return queue.startProcessing(item => {
        items.push(item)
      }, {
        oneShot: true
      })
    })

    it('process the items in the queue', () => {
      expect(items).to.containSubset(['gretchen', 'actress'])
    })
  })

  describe('when processing items and keeping the messages', () => {
    interface Item {
      body: string,
      message: SQS.Message
    }

    let queue : Queue<string>
    let items : Item[] = []

    const keepMessages : boolean = true

    before(async function () : Promise<void> {
      queue = new Queue<string>({
        sqs: sqs,
        endpoint: TestEndpoint,
        concurrency: 1
      })

      await queue.push('bowie')
    })

    before(function () {
      return new Promise((resolve) => {
        const processItem = async function (item : string, message : SQS.Message) {
          items.push({ body: item, message })

          await sqs.changeMessageVisibility({
            QueueUrl: TestEndpoint,
            ReceiptHandle: message.ReceiptHandle,
            VisibilityTimeout: 0
          }).promise()

          if (items.length >= 2) {
            resolve()
          }
        }

        queue.startProcessing(processItem, {
          keepMessages: true
        })
      })
    })

    it('should have processed the same item twice', () => {
      expect(items[0].body).to.equal('bowie')
      expect(items[1].body).to.equal('bowie')
    })

    it('should have different message information', () => {
      const firstReceiptHandle = items[0].message.ReceiptHandle
      const secondReceiptHandle = items[1].message.ReceiptHandle

      // NOTE: The ReceiptHandle must be different. This indicates that the
      // message was posted back to the queue, after it was processed
      expect(firstReceiptHandle).to.not.equal(secondReceiptHandle)
    })
  })
})
