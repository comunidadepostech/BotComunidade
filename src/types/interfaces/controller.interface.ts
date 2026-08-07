export default interface IController {
    handle(...args: any[]): Promise<any>;
}