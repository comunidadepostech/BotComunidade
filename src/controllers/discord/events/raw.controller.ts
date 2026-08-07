import type IController from '../../../types/interfaces/controller.interface';
import type ILoggerService from '../../../types/services/loggerService.interface';

export default class RawEventController implements IController {
    constructor(private logger: ILoggerService) {}

    async handle(packet: any): Promise<void> {
        this.logger.info('Discord event received', { packet });
    }
}
