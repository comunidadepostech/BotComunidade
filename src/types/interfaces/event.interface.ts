export default interface IEvent {
    handle(...args: any[]): Promise<void>;
}