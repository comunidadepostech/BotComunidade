import type IController from '../../types/interfaces/controller.interface';
import type IEventService from '../../types/services/eventService.interface';
import type IFeatureFlagsService from '../../types/services/featureFlagsService.interface';
import type IMessageService from '../../types/services/messageService.interface';

export default class EventVerificationController implements IController {
    constructor(
        private eventService: IEventService,
        private flagsService: IFeatureFlagsService,
        private messageService: IMessageService
    ) {}

    async handle(): Promise<void> {
        const events = await this.eventService.listEvents()

        if (!events) return;

        await this.messageService.sendEventWarning(
            events.filter((event) => this.flagsService.isEnabled(event.guildId, 'enviar_aviso_de_eventos')),
        );

        await this.eventService.autoStart(
            events.filter(
                (event) => this.flagsService.isEnabled(event.guildId, 'comecar_grupo_de_estudos_automaticamente'),
            ),
        );
    }
}
