import type { EventCreateProviderDTO } from '../../dtos/eventCreate.dto';
import type { Event } from '../../../types/event.type';

export default interface IEventProvider {
    /**
     * Create a new event in Discord.
     *
     * @param dto Event creation data transfer object
     */
    createEvent(dto: EventCreateProviderDTO): Promise<string>;

    /**
     * Remove an event from Discord.
     *
     * @param guildId Id of the guild
     * @param eventId Id of the event to remove
     */
    removeEvent(guildId: string, eventId: string): Promise<void>;

    /**
     * List all events.
     */
    listEvents(): Promise<Event<true>[]>;

    /**
     * Update the status of an event.
     *
     * @param event The event object to update
     * @param status The new event status
     */
    setEventStatus(event: Event<true>, status: 'active' | 'completed' | 'canceled'): Promise<void>;

    /**
     * Get the current status of an event.
     *
     * @param event The event object to inspect
     */
    getEventStatus(event: Event<true>): Promise<'active' | 'completed' | 'canceled' | 'scheduled'>;
}
