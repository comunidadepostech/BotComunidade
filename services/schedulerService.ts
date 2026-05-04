import { Client } from 'discord.js';
import type ISchedulerService from '../types/schedulerService.interface.ts';
import type {
    IEventProcessor,
    IMetricsCollector,
    ICleanupManager,
} from '../types/modularScheduler.interfaces.ts';

/**
 * SchedulerService - Orquestra tarefas agendadas delegando para componentes especializados
 * Implementa a interface ISchedulerService
 *
 * Responsabilidades:
 * - Fornecer um ponto de entrada unificado para todas as operações agendadas
 * - Coordenar entre sub-serviços especializados (Processador, Coletor, Limpeza)
 * - Lidar com logging e monitoramento de desempenho de tarefas agendadas
 *
 * Padrão de Projeto (Design Pattern): Fachada (Facade) / Coordenador
 * Divide uma classe complexa em componentes menores de responsabilidade única
 *
 * SOLID:
 * - Responsabilidade Única (Single Responsibility): Apenas coordena, não contém lógica de negócio
 * - Inversão de Dependência (Dependency Inversion): Depende de interfaces, não de implementações concretas
 */
export class SchedulerService implements ISchedulerService {
    constructor(
        private readonly client: Client,
        private readonly eventProcessor: IEventProcessor,
        private readonly metricsCollector: IMetricsCollector,
        private readonly cleanupManager: ICleanupManager,
    ) {}

    /**
     * Verifica todos os eventos agendados em todos os servidores (guilds).
     * Itera através do cache do bot e delega o processamento de cada evento.
     */
    async handleEventVerification(): Promise<void> {
        console.time('Verificação de eventos');

        const processPromises: Promise<void>[] = [];

        // Percorre todos os servidores em que o bot está atualmente
        for (const guild of this.client.guilds.cache.values()) {
            // Percorre todos os eventos atualmente em cache para aquele servidor
            for (const event of guild.scheduledEvents.cache.values()) {
                processPromises.push(this.eventProcessor.process(event));
            }
        }

        // Processa todos os eventos em paralelo e aguarda a conclusão de todos
        await Promise.allSettled(processPromises);

        console.timeEnd('Verificação de eventos');
    }

    /**
     * Coleta e relata a contagem de membros por cargo (role).
     * Delega para o sub-serviço coletor de métricas.
     */
    async handleMembersCount(): Promise<void> {
        await this.metricsCollector.collectMemberCounts();
    }

    /**
     * Coleta e relata a contagem total de membros online.
     * Delega para o sub-serviço coletor de métricas.
     */
    async handleOnlineMembersCount(): Promise<void> {
        await this.metricsCollector.collectOnlinePresence();
    }

    /**
     * Limpa mensagens de aviso de eventos expirados do Discord e do Banco de Dados.
     * Delega para o sub-serviço gerenciador de limpeza.
     */
    async handleEventWarningMessagesDelete(): Promise<void> {
        await this.cleanupManager.cleanupWarningMessages();
    }

    /**
     * Limpa o cache de memória interna de eventos.
     * Delega para o sub-serviço gerenciador de limpeza.
     */
    async handleEventCacheClear(): Promise<void> {
        await this.cleanupManager.clearExpiredCache();
    }
}
