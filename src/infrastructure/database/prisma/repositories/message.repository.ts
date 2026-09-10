import type IMessageRepository from '../../../../types/repositories/messageRepository.interface';
import type { Database } from '../../../../prisma/db.ts';
import type RepositoryMessageSaveDTO from '../../../../types/dtos/repositoryMessageSave.dto.ts';
import type RepositoryPollSaveDTO from '../../../../types/dtos/repositoryPollSave.dto.ts';

export default class MessageRepository implements IMessageRepository {
    constructor(private db: Database) {}

    async savePoll(dto: RepositoryPollSaveDTO): Promise<void> {
        await this.db.orm.public.Polls.create({ ...dto });
    }

    async saveMessage(dto: RepositoryMessageSaveDTO): Promise<void> {
        await this.db.orm.public.Interactions.create({ ...dto });
    }
}
