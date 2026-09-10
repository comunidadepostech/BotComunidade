import type IWarningRepository from '../../../../types/repositories/warningRepository.interface';
import type { Database } from '../../../../prisma/db.ts';

export default class WarningRepository implements IWarningRepository {
    constructor(
        private db: Database,
        private warningMessages: { message_id: string; channel_id: string; event_id: string }[] = [],
    ) {}

    async syncWarningMessages(): Promise<void> {
        this.warningMessages = await this.db.orm.public.DiscordEventWarnings.select(
            'message_id',
            'channel_id',
            'event_id',
        ).all();
    }

    async saveWarningMessage(channelId: string, messageId: string, eventId: string): Promise<void> {
        this.warningMessages.push({ message_id: messageId, channel_id: channelId, event_id: eventId });

        await this.db.orm.public.DiscordEventWarnings.create({
            channel_id: channelId,
            message_id: messageId,
            event_id: eventId,
        });
    }

    async deleteWarningMessage(messageId: string): Promise<void> {
        this.warningMessages = this.warningMessages.filter((message) => message.message_id !== messageId);

        await this.db.orm.public.DiscordEventWarnings.where({ message_id: messageId }).delete();
    }

    listWarningMessages(): { message_id: string; channel_id: string; event_id: string }[] {
        return this.warningMessages;
    }
}
