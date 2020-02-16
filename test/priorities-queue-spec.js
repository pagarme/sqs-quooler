import * as chai from 'chai'
import { Credentials, SQS } from 'aws-sdk'
import PrioritiesQueues from '../src/priorities-queues'

const { expect } = chai

const yopaEndpoint = 'http://yopa:47195/queue'
const lowPirority = 'low-priority'
const defaultPirority = 'default-priority'
const highPirority = 'high-priority'

describe('PrioritiesQueues', () => {
  let sqs
  let myQueues


  before(async () => {
    sqs = await new SQS({
      region: 'yopa-local',
      credentials: new Credentials({
        accessKeyId: 'x',
        secretAccessKey: 'x',
      }),
    })
  })

  beforeEach(async () => {
    await sqs.purgeQueue({
      QueueUrl: `${yopaEndpoint}/${lowPirority}`,
    }).promise()

    await sqs.purgeQueue({
      QueueUrl: `${yopaEndpoint}/${defaultPirority}`,
    }).promise()

    await sqs.purgeQueue({
      QueueUrl: `${yopaEndpoint}/${highPirority}`,
    }).promise()
  })

  describe('when creating a priorities queue instance', () => {
    describe('with correct parameters', () => {
      before(() => {
        myQueues = new PrioritiesQueues({
          sqs,
          queues: {
            [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
            [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
            [highPirority]: `${yopaEndpoint}/${highPirority}`,
          },
          priorities: [
            highPirority,
            defaultPirority,
            lowPirority,
          ],
        })
      })

      it('should have a successful instance', () => {
        expect(myQueues).to.be.instanceOf(PrioritiesQueues)
        expect(myQueues).to.have.property('options')
      })
    })

    describe('without queues', () => {
      let error

      before(() => {
        try {
          myQueues = new PrioritiesQueues({
            sqs,
            priorities: [
              highPirority,
              defaultPirority,
              lowPirority,
            ],
          })
        } catch (err) {
          error = err
        }
      })

      it('should have a successful instance', () => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('type', 'missing parameter')
      })
    })

    describe('without priorities', () => {
      let error

      before(() => {
        try {
          myQueues = new PrioritiesQueues({
            sqs,
            queues: {
              [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
              [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
              [highPirority]: `${yopaEndpoint}/${highPirority}`,
            },
          })
        } catch (err) {
          error = err
        }
      })

      it('should have a successful instance', () => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('type', 'missing parameter')
      })
    })

    describe('with invalid priority', () => {
      let error

      before(() => {
        try {
          myQueues = new PrioritiesQueues({
            sqs,
            queues: {
              [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
              [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
              [highPirority]: `${yopaEndpoint}/${highPirority}`,
            },
            priorities: [
              'fake-queue-name',
              defaultPirority,
              lowPirority,
            ],
          })
        } catch (err) {
          error = err
        }
      })

      it('should have a successful instance', () => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('type', 'invalid parameter')
      })
    })

    describe('with maxPriorityRetries', () => {
      before(() => {
        myQueues = new PrioritiesQueues({
          sqs,
          queues: {
            [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
            [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
            [highPirority]: `${yopaEndpoint}/${highPirority}`,
          },
          priorities: [
            highPirority,
            defaultPirority,
            lowPirority,
          ],
          maxPriorityRetries: 50,
        })
      })

      it('should have an instance with maxPriorityRetries as 50', () => {
        expect(myQueues).to.have.property('maxPriorityRetries', 50)
      })
    })
  })

  describe('when pushing items', () => {
    before(async () => {
      myQueues = new PrioritiesQueues({
        sqs,
        queues: {
          [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
          [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
          [highPirority]: `${yopaEndpoint}/${highPirority}`,
        },
        priorities: [
          highPirority,
          defaultPirority,
          lowPirority,
        ],
        concurrency: 1,
      })
    })

    describe('passing a correct queue name', () => {
      let result

      before(async () => {
        result = await myQueues.push('high', highPirority)
      })

      it('should have a valid response', () => {
        expect(typeof result).to.be.equal('object')
        expect(result).to.have.property('MessageId')
        expect(result).to.have.property('ResponseMetadata')
      })
    })
    describe('passing an invalid queue name', () => {
      let error

      before(async () => {
        try {
          await myQueues.push('high', 'invalid-queue-name')
        } catch (err) {
          error = err
        }
      })

      it('should have an error as response', () => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('type', 'invalid parameter')
        expect(error).to.have.property('message')
      })
    })
    describe('without any queue name', () => {
      let error

      before(async () => {
        try {
          await myQueues.push('high')
        } catch (err) {
          error = err
        }
      })

      it('should have an error as response', () => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('type', 'missing parameter')
        expect(error).to.have.property('message')
      })
    })
  })

  describe('when removing items', () => {
    before(async () => {
      myQueues = new PrioritiesQueues({
        sqs,
        queues: {
          [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
          [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
          [highPirority]: `${yopaEndpoint}/${highPirority}`,
        },
        priorities: [
          highPirority,
          defaultPirority,
          lowPirority,
        ],
        concurrency: 1,
      })
    })

    describe('passing correct parameters', () => {
      let message
      let result

      before(async () => {
        await myQueues.push('high', highPirority)

        await myQueues.startProcessing(
          (_, messageData) => {
            message = messageData
          },
          {
            oneShot: true,
          }
        )

        result = await myQueues.remove(message, highPirority)
      })

      it('should have a valid response', () => {
        expect(typeof result).to.be.equal('object')
        expect(result).to.have.property('ResponseMetadata')
      })
    })

    describe('without message', () => {
      let error

      before(async () => {
        try {
          await myQueues.remove()
        } catch (err) {
          error = err
        }
      })

      it('should have a valid response', () => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('type', 'missing parameter')
      })
    })

    describe('without queue name', () => {
      let error

      before(async () => {
        try {
          await myQueues.remove({ ReceiptHandle: 'fake-id' })
        } catch (err) {
          error = err
        }
      })

      it('should have a valid response', () => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('type', 'missing parameter')
      })
    })

    describe('with invalid message', () => {
      let error

      before(async () => {
        try {
          await myQueues.remove({}, 'invalid-queue-name')
        } catch (err) {
          error = err
        }
      })

      it('should have a valid response', () => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('type', 'invalid parameter')
      })
    })

    describe('with invalid queue name', () => {
      let error

      before(async () => {
        try {
          await myQueues.remove({ ReceiptHandle: 'fake-id' }, 'invalid-queue-name')
        } catch (err) {
          error = err
        }
      })

      it('should have a valid response', () => {
        expect(error).to.be.instanceOf(Error)
        expect(error).to.have.property('type', 'invalid parameter')
      })
    })
  })

  describe('when processing items', () => {
    describe('when processing an item from highest priority queue', () => {
      let foundItem
      let foundQueue

      before(async () => {
        myQueues = new PrioritiesQueues({
          sqs,
          queues: {
            [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
            [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
            [highPirority]: `${yopaEndpoint}/${highPirority}`,
          },
          priorities: [
            highPirority,
            defaultPirority,
            lowPirority,
          ],
          concurrency: 1,
        })

        await myQueues.push('high', highPirority)
      })

      before(async () => {
        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItem = body
            foundQueue = queue
          },
          {
            oneShot: true,
          }
        )
      })

      it('should have an item processed from the high priority queue', () => {
        expect(foundItem).to.be.equal('high')
        expect(foundQueue).to.be.equal(highPirority)
      })
    })

    describe('when processing an item from default priority queue', () => {
      let foundItem
      let foundQueue

      before(async () => {
        myQueues = new PrioritiesQueues({
          sqs,
          queues: {
            [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
            [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
            [highPirority]: `${yopaEndpoint}/${highPirority}`,
          },
          priorities: [
            highPirority,
            defaultPirority,
            lowPirority,
          ],
          concurrency: 1,
        })

        await myQueues.push('default', defaultPirority)
      })

      before(async () => {
        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItem = body
            foundQueue = queue
          },
          {
            oneShot: true,
          }
        )
      })

      it('should have an item processed from the default priority queue', () => {
        expect(foundItem).to.be.equal('default')
        expect(foundQueue).to.be.equal(defaultPirority)
      })
    })

    describe('when processing an item from lowest priority queue', () => {
      let foundItem
      let foundQueue

      before(async () => {
        myQueues = new PrioritiesQueues({
          sqs,
          queues: {
            [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
            [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
            [highPirority]: `${yopaEndpoint}/${highPirority}`,
          },
          priorities: [
            highPirority,
            defaultPirority,
            lowPirority,
          ],
          concurrency: 1,
        })

        await myQueues.push('low', lowPirority)
      })

      before(async () => {
        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItem = body
            foundQueue = queue
          },
          {
            oneShot: true,
          }
        )
      })

      it('should have an item processed from the low priority queue', () => {
        expect(foundItem).to.be.equal('low')
        expect(foundQueue).to.be.equal(lowPirority)
      })
    })

    describe('when processing three items from distinct queues', () => {
      const foundItems = []
      const foundQueues = []

      before(async () => {
        myQueues = new PrioritiesQueues({
          sqs,
          queues: {
            [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
            [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
            [highPirority]: `${yopaEndpoint}/${highPirority}`,
          },
          priorities: [
            highPirority,
            defaultPirority,
            lowPirority,
          ],
          concurrency: 1,
        })

        await myQueues.push('high', highPirority)
        await myQueues.push('default', defaultPirority)
        await myQueues.push('low', lowPirority)
      })

      before(async () => {
        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItems.push(body)
            foundQueues.push(queue)
          },
          {
            oneShot: true,
          }
        )

        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItems.push(body)
            foundQueues.push(queue)
          },
          {
            oneShot: true,
          }
        )

        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItems.push(body)
            foundQueues.push(queue)
          },
          {
            oneShot: true,
          }
        )
      })

      it('should have the first item processed from the high priority queue', () => {
        expect(foundItems[0]).to.be.equal('high')
        expect(foundQueues[0]).to.be.equal(highPirority)
      })

      it('should have the second item processed from the default priority queue', () => {
        expect(foundItems[1]).to.be.equal('default')
        expect(foundQueues[1]).to.be.equal(defaultPirority)
      })

      it('should have the third item processed from the low priority queue', () => {
        expect(foundItems[2]).to.be.equal('low')
        expect(foundQueues[2]).to.be.equal(lowPirority)
      })
    })

    describe('when processing items from distinct queues using maxPriorityRetries', () => {
      const foundItems = []
      const foundQueues = []

      before(async () => {
        myQueues = new PrioritiesQueues({
          sqs,
          queues: {
            [lowPirority]: `${yopaEndpoint}/${lowPirority}`,
            [defaultPirority]: `${yopaEndpoint}/${defaultPirority}`,
            [highPirority]: `${yopaEndpoint}/${highPirority}`,
          },
          priorities: [
            highPirority,
            defaultPirority,
            lowPirority,
          ],
          concurrency: 1,
          maxPriorityRetries: 2,
        })

        await myQueues.push('high-1', highPirority)
        await myQueues.push('high-2', highPirority)
        await myQueues.push('high-3', highPirority)
        await myQueues.push('default-1', defaultPirority)
      })

      before(async () => {
        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItems.push(body)
            foundQueues.push(queue)
          },
          {
            oneShot: true,
          }
        )

        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItems.push(body)
            foundQueues.push(queue)
          },
          {
            oneShot: true,
          }
        )

        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItems.push(body)
            foundQueues.push(queue)
          },
          {
            oneShot: true,
          }
        )

        await myQueues.startProcessing(
          (body, { queue }) => {
            foundItems.push(body)
            foundQueues.push(queue)
          },
          {
            oneShot: true,
          }
        )
      })

      it('should have the first item processed from the high priority queue', () => {
        expect(foundItems[0]).to.be.equal('high-1')
        expect(foundQueues[0]).to.be.equal(highPirority)
      })

      it('should have the second item processed from the high priority queue', () => {
        expect(foundItems[1]).to.be.equal('high-2')
        expect(foundQueues[1]).to.be.equal(highPirority)
      })

      it('should have the third item processed from the default priority queue', () => {
        expect(foundItems[2]).to.be.equal('default-1')
        expect(foundQueues[2]).to.be.equal(defaultPirority)
      })

      it('should have the forth item processed from the high priority queue', () => {
        expect(foundItems[3]).to.be.equal('high-3')
        expect(foundQueues[3]).to.be.equal(highPirority)
      })
    })
  })
})
