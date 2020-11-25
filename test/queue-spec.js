import * as chai from 'chai'
import * as Bluebird from 'bluebird'
import { Credentials, SQS } from 'aws-sdk'
import Queue from '../src/queue'

const { expect } = chai

chai.use(require('chai-subset'))

const TestEndpoint = 'http://yopa:47195/queue/test'

describe('Queue', () => {
  let sqs

  async function getNextSqsItem () {
    const response = await sqs.receiveMessage({
      QueueUrl: TestEndpoint,
      MaxNumberOfMessages: 1,
    }).promise()

    const message = response.Messages[0]
    const item = JSON.parse(message.Body)

    await sqs.deleteMessage({
      QueueUrl: TestEndpoint,
      ReceiptHandle: message.ReceiptHandle,
    }).promise()

    return item
  }

  before(async () => {
    sqs = new SQS({
      region: 'yopa-local',
      credentials: new Credentials({
        accessKeyId: 'x',
        secretAccessKey: 'x',
      }),
    })
  })

  beforeEach(async () => {
    await sqs.purgeQueue({
      QueueUrl: TestEndpoint,
    }).promise()
  })

  describe('when posting an item', () => {
    let queue
    let item

    before(async () => {
      queue = new Queue({
        sqs,
        endpoint: TestEndpoint,
        concurrency: 1,
      })

      await queue.push({
        test: true,
        lol: '123',
      })

      item = await getNextSqsItem()
    })

    it('should correctly post the item', () => {
      expect(item).to.have.property('test', true)
      expect(item).to.have.property('lol', '123')
    })
  })

  describe('when deleting an item', () => {
    let queue
    let receiveMessageResponse

    before(async () => {
      queue = new Queue({
        sqs,
        endpoint: TestEndpoint,
        concurrency: 1,
      })

      await queue.push('mercury')

      const message = await sqs.receiveMessage({
        QueueUrl: TestEndpoint,
        MaxNumberOfMessages: 1,
      }).promise().then(result => result.Messages[0])


      await sqs.changeMessageVisibility({
        QueueUrl: TestEndpoint,
        ReceiptHandle: message.ReceiptHandle,
        VisibilityTimeout: 0,
      }).promise()

      await queue.remove(message)

      receiveMessageResponse = await sqs.receiveMessage({
        QueueUrl: TestEndpoint,
        MaxNumberOfMessages: 1,
      }).promise()
    })

    it('should have no items in the queue', () => {
      expect(receiveMessageResponse).to.not.have.property('Messages')
    })
  })

  describe('when processing items', () => {
    const items = []
    const messages = []
    let queue

    before(async () => {
      queue = new Queue({
        sqs,
        endpoint: TestEndpoint,
        concurrency: 1,
      })

      await queue.push('gretchen', {
        MessageAttributes: {
          type: {
            DataType: 'String',
            StringValue: 'name',
          },
        },
      })
      await queue.push('actress', {
        MessageAttributes: {
          type: {
            DataType: 'String',
            StringValue: 'adjective',
          },
        },
      })
    })

    before((done) => {
      queue.startProcessing((item, message) => {
        items.push(item)
        messages.push(message)

        if (items.length >= 2) {
          done()
        }
      })
    })

    it('process the items in the queue', () => {
      expect(items).to.containSubset(['gretchen', 'actress'])
    })

    it('should have the correct messages', () => {
      expect(messages).to.have.lengthOf(2)

      expect(messages[0].MessageAttributes).to.deep.equal({
        type: {
          DataType: 'String',
          StringValue: 'name',
          BinaryListValues: [],
          StringListValues: [],
        },
      })
      expect(messages[1].MessageAttributes).to.deep.equal({
        type: {
          DataType: 'String',
          StringValue: 'adjective',
          BinaryListValues: [],
          StringListValues: [],
        },
      })
    })

    it('should not resolve promise returned in startProcessing', () => {
      expect(queue.running).to.equal(true)
    })

    describe('when stopping the queue', () => {
      before(() => queue.stopProcessing())

      it('should resolve promise returned in startProcessing', () => {
        expect(queue.running).to.equal(false)
      })

      it('should stop consuming the queue', async () => {
        await queue.push('tdb')

        await Bluebird.delay(100)

        const item = await getNextSqsItem()

        expect(item).to.equal('tdb')
      })
    })
  })

  describe('when changing message visibility timeout', () => {
    let queue
    let message
    let receiveMessageResponse

    before(async () => {
      queue = new Queue({
        sqs,
        endpoint: TestEndpoint,
        concurrency: 1,
      })

      await queue.push('mercury')

      message = await sqs.receiveMessage({
        QueueUrl: TestEndpoint,
        MaxNumberOfMessages: 1,
      }).promise().then(result => result.Messages[0])


      await queue.changeMessageVisibility({
        ReceiptHandle: message.ReceiptHandle,
        VisibilityTimeout: 0,
      })

      receiveMessageResponse = await sqs.receiveMessage({
        QueueUrl: TestEndpoint,
        MaxNumberOfMessages: 1,
      }).promise()
    })

    it('should have received the message again', () => {
      expect(receiveMessageResponse).to.have.property('Messages')
      expect(receiveMessageResponse.Messages[0].Body).to.equal('"mercury"')
      expect(receiveMessageResponse.Messages[0].MessageId)
        .to.equal(message.MessageId)
    })
  })

  describe('when processing items in one shot mode', () => {
    const items = []
    let queue

    before(async () => {
      queue = new Queue({
        sqs,
        endpoint: TestEndpoint,
        concurrency: 1,
      })

      await queue.push('gretchen')
      await queue.push('actress')
    })

    before(() =>
      queue.startProcessing((item) => {
        items.push(item)
      }, {
        oneShot: true,
      }))

    it('process the items in the queue', () => {
      expect(items).to.containSubset(['gretchen', 'actress'])
    })
  })

  describe('when processing items and keeping the messages', () => {
    let queue
    const items = []

    before(async () => {
      queue = new Queue({
        sqs,
        endpoint: TestEndpoint,
        concurrency: 1,
      })

      await queue.push('bowie')
    })

    before(() =>
      new Promise((resolve) => {
        const processItem = async (item, message) => {
          items.push({ body: item, message })

          await sqs.changeMessageVisibility({
            QueueUrl: TestEndpoint,
            ReceiptHandle: message.ReceiptHandle,
            VisibilityTimeout: 0,
          }).promise()

          if (items.length >= 2) {
            resolve()
          }
        }

        queue.startProcessing(processItem, {
          keepMessages: true,
        })
      }))

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

  describe('when passing invalid payloads', () => {
    let queue
    const items = []
    const stringEvent = 'testingString'
    const invalidJSON = '{test}'

    before(async () => {
      queue = new Queue({
        sqs,
        endpoint: TestEndpoint,
        concurrency: 1,
      })

      await sqs
        .sendMessage({
          QueueUrl: TestEndpoint,
          MessageBody: stringEvent,
        })
        .promise()

      await queue.startProcessing((item) => {
        items.push(item)
      }, {
        oneShot: true,
      })

      await sqs
        .sendMessage({
          QueueUrl: TestEndpoint,
          MessageBody: invalidJSON,
        })
        .promise()

      await queue.startProcessing((item) => {
        items.push(item)
        queue.stopProcessing()
      }, {
        oneShot: true,
      })
    })

    it('should accept adding a string', () => {
      expect(items[0]).to.be.equal(stringEvent)
    })

    it('should not allow invalid JSON payloads', () => {
      expect(items[1]).to.be.equal(invalidJSON)
    })
  })
})
