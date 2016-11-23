export declare class Signal {
    private triggerFn;
    promise: PromiseLike<void>;
    constructor();
    trigger(): void;
}
