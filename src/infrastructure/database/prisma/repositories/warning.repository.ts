import type IWarningRepository from '../../../../types/repositories/warningRepository.interface';
import { PrismaClient } from '../../../../../prisma/generated/client.ts';

export default class WarningRepository implements IWarningRepository {
    constructor(
        private db: PrismaClient,
        private warningMessages: { message_id: string; channel_id: string; event_id: string }[] = [],
    ) {}

    async syncWarningMessages(): Promise<void> {
        this.warningMessages = await this.db.discord_event_warnings.findMany();
    }

    async saveWarningMessage(channelId: string, messageId: string, eventId: string): Promise<void> {
        this.warningMessages.push({ message_id: messageId, channel_id: channelId, event_id: eventId });

        await this.db.discord_event_warnings.create({
            data: {
                channel_id: channelId,
                message_id: messageId,
                event_id: eventId,
            },
        });
    }

    async deleteWarningMessage(messageId: string): Promise<void> {
        this.warningMessages = this.warningMessages.filter((message) => message.message_id === messageId);

        await this.db.discord_event_warnings.delete({
            where: {
                message_id: messageId,
            },
        });
    }

    listWarningMessages(): { message_id: string; channel_id: string, event_id: string }[] {
        return this.warningMessages;
    }
}
