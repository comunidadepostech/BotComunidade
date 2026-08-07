import type N8NMessageSaveDTO from '../../dtos/n8nMessageSave.dto';
import type N8NPollSaveDTO from '../../dtos/n8nPollSave.dto';

export default interface IN8NMessageProvider {
    /**
     * Save a message record for n8n integration.
     *
     * @param dto Message data transfer object for saving
     */
    saveMessage(dto: N8NMessageSaveDTO): Promise<void>;

    /**
     * Save a poll record for n8n integration.
     *
     * @param dto Poll data transfer object for saving
     */
    savePoll(dto: N8NPollSaveDTO): Promise<void>;
}
