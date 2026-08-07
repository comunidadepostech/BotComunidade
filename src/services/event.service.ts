import type { EventCreateProviderDTO, EventCreateServiceDTO } from '../types/dtos/eventCreate.dto';
import type IEventProvider from '../types/providers/discord/eventProvider.interface';
import type IEventService from '../types/services/eventService.interface';
import type { Event } from '../types/event.type';
import { STUDY_GROUP_POSSIBLE_NAMES } from '../utils/constants/discordConstants';
import env from '../config/env';
import type IFeatureFlagsService from '../types/services/featureFlagsService.interface';

export default class EventService implements IEventService {
    constructor(
        private eventProvider: IEventProvider,
        private flagsService: IFeatureFlagsService,
    ) {}

    async listEvents(): Promise<Event<true>[]> {
        return await this.eventProvider.listEvents();
    }

    async createEvent(dto: EventCreateServiceDTO): Promise<string[]> {
        const results: string[] = [];
        for (const guild of dto.guilds) {
            const providerDto: EventCreateProviderDTO = {
                ...dto,
                guildId: guild,
            };

            const result = await this.eventProvider.createEvent(providerDto);
            results.push(result);
        }
        return results;
    }

    async removeEvent(guildId: string, eventId: string): Promise<void> {
        this.eventProvider.removeEvent(guildId, eventId);
    }

    async autoStart(events: Event<true>[]): Promise<void> {
        for (const event of events) {
            if (!this.flagsService.isEnabled(event.guildId, 'comecar_grupo_de_estudos_automaticamente')) return;

            const eventName = event.topic.split(' - ')[1];

            if (!eventName) return;

            // Only auto start events when it is a "study group"
            if (!STUDY_GROUP_POSSIBLE_NAMES.includes(eventName)) return;

            if (
                Date.now() - event.scheduledStart.getTime() > 0 &&
                (await this.eventProvider.getEventStatus(event)) === 'scheduled'
            )
                await this.eventProvider.setEventStatus(event, 'active');

            if (
                Date.now() - event.scheduledStart.getTime() >
                    env.MAX_STUDY_GROUP_NOTIFICATION_DURATION_IN_HOURS * 60 * 60 * 1000 &&
                (await this.eventProvider.getEventStatus(event)) === 'active'
            )
                await this.eventProvider.setEventStatus(event, 'completed');
        }
    }
}
