/**
 * ISchedulerService - Interface para o Serviço Agendador (Scheduler Service)
 *
 * Responsabilidades:
 * - Lidar com a verificação periódica de eventos do Discord
 * - Gerenciar a coleta de métricas de contagem de membros
 * - Processar notificações e avisos relacionados a eventos
 * - Manter o ciclo de vida dos eventos (início/conclusão automática)
 */
export default interface ISchedulerService {
    /**
     * Verifica todos os eventos agendados em todos os servidores e processa as transições de estado
     */
    handleEventVerification(): Promise<void>;

    /**
     * Coleta a contagem de membros por cargo para todos os servidores e envia para um serviço externo
     */
    handleMembersCount(): Promise<void>;

    /**
     * Coleta a contagem de membros online/ativos em todos os servidores
     */
    handleOnlineMembersCount(): Promise<void>;

    /**
     * Exclui mensagens de aviso de eventos expirados dos canais do Discord
     */
    handleEventWarningMessagesDelete(): Promise<void>;

    /**
     * Limpa o cache interno de eventos para eventos que não existem mais no Discord
     */
    handleEventCacheClear(): Promise<void>;
}
