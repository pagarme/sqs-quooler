/// <reference types="node" />
import { EventEmitter } from 'events';
import { SQS } from 'aws-sdk';
export default class Queue extends EventEmitter {
    options: {
        sqs: SQS;
        endpoint: string;
        concurrency: number;
    };
    running: boolean;
    stopped: any;
    constructor(options: {
        sqs: SQS;
        endpoint: string;
        concurrency: number;
    });
    push(item: Object, parameters?: {}): Promise<void>;
    remove(message: any): Promise<void>;
    changeMessageVisibility(parameters: {
        ReceiptHandle: string;
        VisibilityTimeout: number;
    }): Promise<void>;
    startProcessing(handler: any, options?: {
        keepMessages?: boolean;
        oneShot?: boolean;
    }): any;
    stopProcessing(): any;
}
