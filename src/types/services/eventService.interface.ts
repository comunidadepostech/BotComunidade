import type { EventCreateServiceDTO } from '../dtos/eventCreate.dto';
import type { Event } from '../event.type';

export default interface IEventService {
    /**
     * Create one or more scheduled events.
     *
     * @param dto Event creation data transfer object
     */
    createEvent(dto: EventCreateServiceDTO): Promise<string[]>;

    /**
     * Remove a scheduled event.
     *
     * @param guildId The guild ID
     * @param eventId The event ID to remove
     */
    removeEvent(guildId: string, eventId: string): Promise<void>;

    /**
     * List all scheduled events.
     */
    listEvents(): Promise<Event<true>[]>;

    /**
     * Automatically start the provided events when their time arrives.
     *
     * @param events The events to auto-start
     */
    autoStart(events: Event<true>[]): Promise<void>;
}
