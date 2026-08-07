import type IController from '../../../types/interfaces/controller.interface';
import type ILoggerService from '../../../types/services/loggerService.interface';

export default class DebugEventController implements IController {
    constructor(private logger: ILoggerService){}
    
    async handle(message: string): Promise<void> {
        this.logger.info(message)
    }
}
