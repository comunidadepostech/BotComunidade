import type IController from '../../types/interfaces/controller.interface';
import type IMessageService from '../../types/services/messageService.interface';

export default class EventMessageDeleteController implements IController {
    constructor(private messageService: IMessageService) {}

    async handle(): Promise<void> {
        await this.messageService.clearEventWarnings()
    }
}
