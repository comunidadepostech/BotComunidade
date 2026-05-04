import type { GuildScheduledEvent, Role, TextChannel } from 'discord.js';

/**
 * Interface para o componente processador de eventos.
 * Responsável pela lógica de negócio das transições de estado de eventos individuais.
 */
export interface IEventProcessor {
    /**
     * Processa um único evento agendado do Discord, lidando com notificações,
     * início automático e lógica de conclusão automática.
     */
    process(event: GuildScheduledEvent): Promise<void>;
}

/**
 * Interface para o componente coletor de métricas.
 * Responsável por coletar dados sobre membros do servidor e presença online.
 */
export interface IMetricsCollector {
    /**
     * Coleta a contagem de membros por cargo (role) para todos os servidores.
     */
    collectMemberCounts(): Promise<void>;

    /**
     * Coleta a contagem total de membros online/ativos em todos os servidores.
     */
    collectOnlinePresence(): Promise<void>;
}

/**
 * Interface para o componente gerenciador de limpeza (cleanup).
 * Responsável por tarefas de manutenção, como excluir mensagens expiradas ou limpar o cache.
 */
export interface ICleanupManager {
    /**
     * Exclui mensagens de aviso de eventos expirados dos canais do Discord e do banco de dados.
     */
    cleanupWarningMessages(): Promise<void>;

    /**
     * Limpa o cache interno de eventos que não existem mais no Discord.
     */
    clearExpiredCache(): Promise<void>;
}

/**
 * Interface para o despachante de notificações.
 * Abstrai como os avisos são enviados para os canais.
 */
export interface INotificationDispatcher {
    /**
     * Envia uma mensagem de aviso para um canal específico sobre um evento próximo.
     */
    dispatchWarning(
        classRole: Role | undefined,
        eventUrl: string,
        scheduledStartTimestamp: number,
        channel: TextChannel,
    ): Promise<void>;
}
