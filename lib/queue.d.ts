import { SQS } from 'aws-sdk';
export interface QueueOptions {
    sqs: SQS;
    endpoint: string;
    concurrency?: number;
}
export declare class Queue<TItem> {
    private options;
    constructor(options: QueueOptions);
    push(item: TItem): Promise<void>;
}
