/// <reference types="node" />
import { SQS } from 'aws-sdk';
import { EventEmitter } from 'events';
export interface QueueOptions {
    sqs: SQS;
    endpoint: string;
    concurrency?: number;
}
export interface ProcessOptions {
    oneShot?: boolean;
    keepMessages?: boolean;
}
export interface Params {
    MessageGroupId?: String;
}
export declare class Queue<TItem> extends EventEmitter {
    private options;
    private running;
    private stopped;
    constructor(options: QueueOptions);
    push(item: TItem, parameters?: Params): Promise<void>;
    remove(message: SQS.Message): Promise<void>;
    startProcessing(handler: (item: TItem, message: SQS.Message) => any | PromiseLike<any>, options?: ProcessOptions): PromiseLike<void>;
    stopProcessing(): PromiseLike<void>;
}
