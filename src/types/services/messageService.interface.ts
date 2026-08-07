import type { Attachment } from '../attachment.type';
import type { Channel } from '../channel.types';
import type { MessageAction } from '../component.types';
import type BroadcastMessageDTO from '../dtos/broadcastMessage.dtos';
import type MessageSaveDTO from '../dtos/messageSave.dto';
import type PollMessageDTO from '../dtos/pollMessage.dto';
import type SavePollMessageDTO from '../dtos/savePollMessage.dto';
import type VacancyDTO from '../dtos/vacancy.dto';
import type WelcomeMessageDTO from '../dtos/welcomeMessage.dto';
import type { Event } from '../event.type';

export default interface IMessageService {
    /**
     * Sends a message to the specified channel or channels with the given content and attachments.
     *
     * @param channel The channel or channels where the message will be sent
     * @param content The content of the message
     * @param attachment Attachments of the message
     */
    sendMessage(channel: Channel, content: string, options?: { attachments?: Attachment[], actions?: MessageAction[], replyTo?: string }): Promise<string>;

    /**
     * Sends a poll message to the specified channel or channels with the given poll data.
     *
     * @param dto The poll data transfer object containing the poll question, answers, and other settings
     * @param channel The channel or channels where the poll will be sent
     */
    sendPoll(dto: PollMessageDTO, channel: Channel[] | Channel): Promise<void>;

    /**
     * Saves a message.
     *
     * @param dto The message data transfer object
     */
    saveMessage(dto: MessageSaveDTO): Promise<void>;

    /**
     * broadcasts a message to the specified target channel with the given content and attachments.
     *
     * @param guildId Id of the guild
     * @param className The name of the class (Example: 9ADJT)
     */
    broadcast(dto: BroadcastMessageDTO): Promise<void>;

    /**
     * Edits a message from the bot
     *
     * @param channelId The channel id where the message is
     * @param messageId The id of the message that will be modified
     * @param content The new content of the message
     */
    editMessage(channelId: string, messageId: string, content: string): Promise<void>;

    /**
     * Sends a welcome message.
     *
     * @param dto The member data transfer object
     */
    sendWelcomeMessage(dto: WelcomeMessageDTO): Promise<void>;

    /**
     * Save a poll.
     *
     * @param dto The poll data transfer object
     */
    savePoll(dto: SavePollMessageDTO): Promise<void>;

    /**
     * Clear all event warnings.
     */
    clearEventWarnings(): Promise<void>;

    /**
     * Send event warnings to the specified channels (in the event) or to all channels in the guild.
     *
     * @param events Active events to be sent
     */
    sendEventWarning(events: Event<true>[]): Promise<void>;

    /**
     * Delete a message.
     *
     * @param channelId Channel id
     * @param messageId Message id
     */
    deleteMessage(channelId: string, messageId: string): Promise<void>;

    /**
     * Send a vacancy message in the vacancy channel.
     *
     * @param vacancy The vacancy data transfer object
     */
    sendVacancyMessage(vacancy: VacancyDTO): Promise<void>;
}
