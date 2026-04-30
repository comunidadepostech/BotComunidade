import { Client } from 'discord.js';
import type { ICleanupManager } from '../../types/modularScheduler.interfaces.ts';
import type { IWarningRepository } from '../../types/repository.interfaces.ts';
import type { WarningMessageRow } from '../../types/database.interfaces.ts';
import type { EventState } from '../../types/discord.interfaces.ts';

/**
 * CleanupManagerService - Lida com tarefas de manutenção e limpeza para o agendador (scheduler)
 * Implementa ICleanupManager
 *
 * Responsabilidades:
 * - Excluir mensagens de aviso expiradas dos canais do Discord
 * - Remover registros de mensagens rastreadas do banco de dados após a limpeza
 * - Limpar o cache de eventos interno para eventos que não existem mais no Discord
 *
 * SOLID: Responsabilidade Única (Single Responsibility) - Apenas gerencia operações de limpeza e poda (pruning)
 */
export default class CleanupManagerService implements ICleanupManager {
    constructor(
        private readonly client: Client,
        private readonly databaseWarningRepository: IWarningRepository,
        private readonly eventsCache: Map<string, EventState>,
    ) {}

    /**
     * Identifica e exclui mensagens de aviso expiradas do Discord
     * e então limpa a tabela de rastreamento do banco de dados.
     */
    async cleanupWarningMessages(): Promise<void> {
        const messages = (await this.databaseWarningRepository.check()) as WarningMessageRow[];

        if (!messages || messages.length === 0) return;

        for (const { message_id, channel_id } of messages) {
            try {
                const channel = await this.client.channels.fetch(channel_id);

                if (!channel || !channel.isTextBased()) continue;

                const message = await channel.messages.fetch(message_id).catch((error) => {
                    // Falha silenciosa se a mensagem já tiver sido removida
                    console.debug(
                        `Could not fetch message ${message_id} for cleanup: ${error.message}`,
                    );
                    return null;
                });

                if (message && message.deletable) {
                    await channel.messages.delete(message_id);
                }
            } catch (error) {
                console.error(
                    `Error cleaning up message ${message_id}:`,
                    error instanceof Error ? error.message : error,
                );
            }
        }

        // Limpar o rastreamento do banco de dados, pois tentamos a limpeza de todos os registros
        await this.databaseWarningRepository.delete();
    }

    /**
     * Limpa o cache de memória interna para eventos que foram removidos do Discord
     * para evitar vazamentos de memória e processamento obsoleto.
     */
    async clearExpiredCache(): Promise<void> {
        for (const [eventID, state] of this.eventsCache.entries()) {
            try {
                const guild = await this.client.guilds.fetch(state.guildID);
                if (!guild.scheduledEvents.cache.has(eventID)) {
                    this.eventsCache.delete(eventID);
                }
            } catch (error) {
                // Se a busca pelo servidor falhar, o servidor pode ter sido removido, limpar cache
                console.error(
                    `Failed to verify cache for event ${eventID} in guild ${state.guildID}:`,
                    error,
                );
                this.eventsCache.delete(eventID);
            }
        }
    }
}
