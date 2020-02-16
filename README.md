
<img src="https://avatars1.githubusercontent.com/u/3846050?v=4&s=200" width="127px" height="127px" align="left"/>

# SQS Quooler
[![Build Status](https://travis-ci.org/pagarme/sqs-quooler.svg?branch=master)](https://travis-ci.org/pagarme/sqs-quooler)
[![npm](https://img.shields.io/npm/dm/sqs-quooler.svg)](https://npmjs.com/package/sqs-quooler)

:walking::walking::walking::walking: An abstraction of Amazon's SQS SDK. It provides an easier to use interface than that of [Amazon's SDK](https://www.npmjs.com/package/aws-sdk).

## Installation
`npm install --save sqs-quooler`

## Usage

### Single queue

#### Connecting to the queue
>Note `aws-sdk` still needs to be imported. SQS Quooler is just a wrapper.

```javascript
const { SQS, Credentials } = require('aws-sdk')
const { Queue } = require('sqs-quooler')

const sqs = new SQS({
  region: 'your aws region',
  endpoint: 'your aws endpoint',
  // Credentials can be used with YOPA as below
  // credentials: new Credentials({
  //   accessKeyId: 'x',
  //   secretAccessKey: 'x',
  // }),
})

const myQueue = new Queue({
  sqs,
  endpoint: 'your aws endpoint + queue name',
  concurrency: 1, // MaxNumberOfMessages
})
```
#### Pushing items to the queue
>`myQueue.push` (data: any) : Promise

Data sent via `.push` will be stringified before it's sent to SQS.

```javascript
myQueue.push({
  data: 'test',
})
```
#### Removing items from the queue
>`myQueue.remove` (message: object) : Promise

Message object should have a `ReceiptHandle` property, to identify the message.

```javascript
myQueue.remove({
  ...
  ReceiptHandle: 'receipt handle',
  ...
})
```
#### Changing message visibility
>`myQueue.changeMessageVisibility` (parameters: object) : Promise

Parameters object should have a `ReceiptHandle` property, to identify the message, and a `VisibilityTimeout` property to determine in how many seconds the item will return to the queue.

```javascript
myQueue.changeMessageVisibility({
  ...
  ReceiptHandle: 'receipt handle',
  VisibilityTimeout: 0, // returns immediately to the queue
  ...
})
```
#### Retrieving items from the queue
>`myQueue.startProcessing` (handler: function, options: object) : Promise

Handler function should accept 2 arguments, the first one being the parsed message `Body` value, and the second one being the whole message object. It will be called once for every message found in the queue (depending on the queue's `concurrency`).
The options object is optional and may receive a `keepMessages` property (boolean).
After the handler returns (if it returns a Promise, SQS Quooler will wait for it to resolve), the item is automatically deleted from the queue. If your handler throws an error, or returns a rejected Promise, the item will not be removed from the queue.

```javascript
myQueue.startProcessing((body, message) => {
  // body: {
  //   data: 'test',
  // }

  // message: {
  //   Body: '{"data":"test"}',
  //   ReceiptHandle: 'receipt handle',
  //   ...
  // }
})
```
#### Stop processing the queue
>`myQueue.stopProcessing` () : Promise

```javascript
myQueue.stopProcessing()
```

### Priorities queue

#### Connecting to the queue
>Note `aws-sdk` still needs to be imported. SQS Quooler is just a wrapper.

```javascript
const { SQS, Credentials } = require('aws-sdk')
const { PrioritiesQueues } = require('sqs-quooler')

const sqs = new SQS({
  region: 'your aws region',
  endpoint: 'your aws endpoint',
  // Credentials can be used with YOPA as below
  // credentials: new Credentials({
  //   accessKeyId: 'x',
  //   secretAccessKey: 'x',
  // }),
})

const myQueues = new PrioritiesQueues({
  sqs,
  queues: {
    'low-pirority-events': 'your aws endpoint + queue name',
    'default-pirority-events': 'your aws endpoint + queue name',
    'high-pirority-events': 'your aws endpoint + queue name',
  },
  priorities: [ // order which the startProcessing will consume itens
    'high-pirority-events',
    'default-pirority-events',
    'low-pirority-events',
  ],
  concurrency: 1,
  maxPriorityRetries: 100, // number which will temporarily reorder the priorities
})
```

#### Pushing items to the queue
>`myQueues.push` (data: any, queue: String) : Promise

Data sent via `.push` will be stringified before it's sent to SQS.

```javascript
myQueues.push(
  {
    data: 'test',
  },
  'high-pirority-events'
)
```

#### Removing items from the queue
>`myQueues.remove` (message: object, queue: String) : Promise

Message object should have a `ReceiptHandle` property, to identify the message.

```javascript
myQueues.remove(
  {
    ...
    ReceiptHandle: 'receipt handle',
    ...
  },
  'high-pirority-events'
)
```

#### Changing message visibility
>`myQueues.changeMessageVisibility` (parameters: object, queue: String) : Promise

Parameters object should have a `ReceiptHandle` property, to identify the message, and a `VisibilityTimeout` property to determine in how many seconds the item will return to the queue.

```javascript
myQueues.changeMessageVisibility(
  {
    ...
    ReceiptHandle: 'receipt handle',
    VisibilityTimeout: 0, // returns immediately to the queue
    ...
  },
  'high-pirority-events'
)
```

#### Retrieving items from the queue
>`myQueuess.startProcessing` (handler: function, options: object) : Promise

Handler function should accept 2 arguments, the first one being the parsed message `Body` value, and the second one being the whole message object. It will be called once for every message found in the queue (depending on the queue's `concurrency`).
The options object is optional and may receive a `keepMessages` property (boolean).
After the handler returns (if it returns a Promise, SQS Quooler will wait for it to resolve), the item is automatically deleted from the queue. If your handler throws an error, or returns a rejected Promise, the item will not be removed from the queue.

```javascript
myQueues.startProcessing((body, message) => {
  // body: {
  //   data: 'test',
  // }

  // message: {
  //   Body: '{"data":"test"}',
  //   ReceiptHandle: 'receipt handle',
  //   queue: 'high-pirority-events',
  //   ...
  // }
})
```
#### Stop processing the queue
>`myQueues.stopProcessing` () : Promise

```javascript
myQueues.stopProcessing()
```


## License
>You can check out the full license [here](https://github.com/pagarme/sqs-quooler/blob/master/LICENSE)

This project is licensed under the terms of the **MIT** license.
