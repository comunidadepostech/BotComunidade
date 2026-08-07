import type { Attachment } from '../../attachment.type';
import type { Channel } from '../../channel.types';
import type { MessageAction } from '../../component.types';
import type PollMessageDTO from '../../dtos/pollMessage.dto';
import type { Message } from '../../message.type';
import type { Thread } from '../../thread.type';

export default interface IMessageProvider {
    /**
     * Send a message to the specified channel with optional attachments.
     *
     * @param channel The destination channel
     * @param content The message content
     * @param attachment Optional attachments for the message
     * @param actions Optional message actions like buttons
     */
    sendMessage(
        channel: Channel | Thread,
        content: string,
        options?: { attachment?: Attachment[]; actions?: MessageAction[]; replyTo?: string },
    ): Promise<string>;

    /**
     * Delete a message from the specified channel.
     *
     * @param channel The channel containing the message
     * @param messageId The ID of the message to delete
     */
    deleteMessage(channelId: string, messageId: string): Promise<void>;

    /**
     * Edit an existing message in the specified channel.
     *
     * @param channel The channel containing the message
     * @param messageId The ID of the message to edit
     * @param content The updated message content
     */
    editMessage(channelId: string, messageId: string, content: string): Promise<void>;

    /**
     * Create a poll message in the specified channel.
     *
     * @param poll Poll data transfer object
     * @param channel The destination channel
     */
    createPoll(poll: PollMessageDTO, channel: Channel): Promise<void>;

    /**
     * Retrieve a message by its ID from the specified channel.
     *
     * @param channelId The channel ID where the message is located
     * @param messageId The ID of the message to retrieve
     */
    getMessageById(channelId: string, messageId: string): Promise<Message>;
}
