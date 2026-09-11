import type IMessageRepository from '../../../types/repositories/messageRepository.interface';
import type { Database } from '../../../db/index.ts';
import { interactions, polls } from '../../../db/schema.ts';
import type RepositoryMessageSaveDTO from '../../../types/dtos/repositoryMessageSave.dto.ts';
import type RepositoryPollSaveDTO from '../../../types/dtos/repositoryPollSave.dto.ts';

export default class MessageRepository implements IMessageRepository {
    constructor(private db: Database) {}

    async savePoll(dto: RepositoryPollSaveDTO): Promise<void> {
        await this.db.insert(polls).values({ ...dto });
    }

    async saveMessage(dto: RepositoryMessageSaveDTO): Promise<void> {
        await this.db.insert(interactions).values({ ...dto });
    }
}
