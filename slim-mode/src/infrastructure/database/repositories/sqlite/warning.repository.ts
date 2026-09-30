import { eq } from 'drizzle-orm';
import type IWarningRepository from '../../../../types/repositories/warningRepository.interface';
import type { SqliteDatabase } from '../../sqlite.client.ts';
import { discordEventWarnings } from '../../../../db/sqlite.schema.ts';

export default class SqliteWarningRepository implements IWarningRepository {
    constructor(
        private db: SqliteDatabase,
        private warningMessages: { message_id: string; channel_id: string; event_id: string }[] = [],
    ) {}

    async syncWarningMessages(): Promise<void> {
        this.warningMessages = this.db
            .select({
                message_id: discordEventWarnings.message_id,
                channel_id: discordEventWarnings.channel_id,
                event_id: discordEventWarnings.event_id,
            })
            .from(discordEventWarnings)
            .all();
    }

    async saveWarningMessage(channelId: string, messageId: string, eventId: string): Promise<void> {
        this.warningMessages.push({ message_id: messageId, channel_id: channelId, event_id: eventId });

        this.db
            .insert(discordEventWarnings)
            .values({ channel_id: channelId, message_id: messageId, event_id: eventId })
            .run();
    }

    async deleteWarningMessage(messageId: string): Promise<void> {
        this.warningMessages = this.warningMessages.filter((message) => message.message_id !== messageId);

        this.db.delete(discordEventWarnings).where(eq(discordEventWarnings.message_id, messageId)).run();
    }

    listWarningMessages(): { message_id: string; channel_id: string; event_id: string }[] {
        return this.warningMessages;
    }
}
