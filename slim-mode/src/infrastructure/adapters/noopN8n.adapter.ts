import type IN8NMessageProvider from '../../types/providers/n8n/messageProvider.interface';

/**
 * Modo SLIM: nenhuma telemetria é enviada ao n8n.
 */
export default class NoopN8nAdapter implements IN8NMessageProvider {
    async saveMessage(): Promise<void> {
        // intencionalmente vazio
    }

    async savePoll(): Promise<void> {
        // intencionalmente vazio
    }
}
