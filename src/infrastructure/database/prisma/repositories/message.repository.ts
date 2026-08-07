import type IMessageRepository from '../../../../types/repositories/messageRepository.interface';
import { PrismaClient } from '../../../../../prisma/generated/client.ts';
import type RepositoryMessageSaveDTO from '../../../../types/dtos/repositoryMessageSave.dto.ts';
import type RepositoryPollSaveDTO from '../../../../types/dtos/repositoryPollSave.dto.ts';

export default class MessageRepository implements IMessageRepository {
    constructor(private db: PrismaClient) {}

    async savePoll(dto: RepositoryPollSaveDTO): Promise<void> {
        await this.db.polls.create({
            data: { ...dto },
        });
    }

    async saveMessage(dto: RepositoryMessageSaveDTO): Promise<void> {
        await this.db.interactions.create({
            data: { ...dto },
        });
    }
}
