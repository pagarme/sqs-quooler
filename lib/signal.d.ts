export default class Signal {
    promise: Promise<void>;
    triggerFn: () => void;
    constructor();
    trigger(): void;
}
