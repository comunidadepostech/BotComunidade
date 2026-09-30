import type IMessageRepository from '../../../../types/repositories/messageRepository.interface';

/**
 * Modo SLIM: mensagens e enquetes não são salvas em lugar nenhum.
 */
export default class NoopMessageRepository implements IMessageRepository {
    async saveMessage(): Promise<void> {
        // intencionalmente vazio
    }

    async savePoll(): Promise<void> {
        // intencionalmente vazio
    }
}
