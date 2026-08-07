import type RepositoryMessageSaveDTO from "../dtos/repositoryMessageSave.dto";
import type RepositoryPollSaveDTO from "../dtos/repositoryPollSave.dto";


export default interface IMessageRepository {
    /**
     * Saves a message in the database.
     *
     * @param dto RepositoryMessageSaveDTO
     */
    saveMessage(dto: RepositoryMessageSaveDTO): Promise<void>;

    /**
     * Saves a poll in the database.
     *
     * @param dto RepositoryPollSaveDTO
     */
    savePoll(dto: RepositoryPollSaveDTO): Promise<void>;
}
