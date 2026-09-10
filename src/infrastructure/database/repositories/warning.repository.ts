import { eq } from 'drizzle-orm';
import type IWarningRepository from '../../../types/repositories/warningRepository.interface';
import type { Database } from '../../../db/index.ts';
import { discordEventWarnings } from '../../../db/schema.ts';

export default class WarningRepository implements IWarningRepository {
    constructor(
        private db: Database,
        private warningMessages: { message_id: string; channel_id: string; event_id: string }[] = [],
    ) {}

    async syncWarningMessages(): Promise<void> {
        this.warningMessages = await this.db
            .select({
                message_id: discordEventWarnings.message_id,
                channel_id: discordEventWarnings.channel_id,
                event_id: discordEventWarnings.event_id,
            })
            .from(discordEventWarnings);
    }

    async saveWarningMessage(channelId: string, messageId: string, eventId: string): Promise<void> {
        this.warningMessages.push({ message_id: messageId, channel_id: channelId, event_id: eventId });

        await this.db
            .insert(discordEventWarnings)
            .values({ channel_id: channelId, message_id: messageId, event_id: eventId });
    }

    async deleteWarningMessage(messageId: string): Promise<void> {
        this.warningMessages = this.warningMessages.filter((message) => message.message_id !== messageId);

        await this.db.delete(discordEventWarnings).where(eq(discordEventWarnings.message_id, messageId));
    }

    listWarningMessages(): { message_id: string; channel_id: string; event_id: string }[] {
        return this.warningMessages;
    }
}
