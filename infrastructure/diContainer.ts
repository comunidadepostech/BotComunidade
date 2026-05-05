/**
 * Container de Injeção de Dependência
 * Implementa o padrão de Injeção de Dependência para gerenciar a instanciação de serviços e dependências
 * Segue o princípio de Inversão de Controle para baixo acoplamento
 */

import type { Client } from 'discord.js';
import DatabaseConnection from '../repositories/database/databaseConnection.ts';
import type {
    IDatabaseConnection,
    IFlagsRepository,
    ICheckRepository,
    IGuildsRepository,
    IWarningRepository,
    ICommandHashRepository,
    IRepositoryFactory,
} from '../types/repository.interfaces.ts';
import type { IDiscordService } from '../types/discord.interfaces.ts';
import type IFeatureFlagsService from '../types/featureFlagsService.interface.ts';
import type ISchedulerService from '../types/schedulerService.interface.ts';
import type IN8nService from '../types/n8nService.interface.ts';
import { env } from '../config/env.ts';
import DatabaseFlagsRepository from '../repositories/database/databaseFlagsRepository.ts';
import DatabaseCheckRepository from '../repositories/database/databaseCheck.ts';
import DatabaseGuildsRepository from '../repositories/database/databaseGuildsRepository.ts';
import DatabaseWarningRepository from '../repositories/database/databaseWarningRepository.ts';
import DatabaseCommandHashRepository from '../repositories/database/databaseCommandHashRepository.ts';
import DiscordService from '../services/discordService.ts';
import EventsSubService from '../services/discord/eventsSubService.ts';
import MessagesSubService from '../services/discord/messagesSubService.ts';
import RolesSubService from '../services/discord/rolesSubService.ts';
import ClassSubService from '../services/discord/classSubService.ts';
import CommandsSubService from '../services/discord/commandsSubService.ts';
import FeatureFlagsService from '../services/featureFlagsService.ts';
import LinkedinService from '../services/linkedinService.ts';
import { SchedulerService } from '../services/schedulerService.ts';
import N8nService from '../services/n8nService.ts';
import type { EventState } from '../types/discord.interfaces.ts';
import NotificationDispatcherService from '../services/scheduler/notificationDispatcherService.ts';
import EventProcessorService from '../services/scheduler/eventProcessorService.ts';
import MetricCollectorService from '../services/scheduler/metricCollectorService.ts';
import CleanupManagerService from '../services/scheduler/cleanupManagerService.ts';

/**
 * Implementação da Factory de Repositório
 * Cria e gerencia instâncias de repositório
 */
class RepositoryFactory implements IRepositoryFactory {
    constructor(private databaseConnection: IDatabaseConnection) {}

    createFlagsRepository(): IFlagsRepository {
        return new DatabaseFlagsRepository(this.databaseConnection);
    }

    createCheckRepository(): ICheckRepository {
        return new DatabaseCheckRepository(this.databaseConnection);
    }

    createGuildsRepository(): IGuildsRepository {
        return new DatabaseGuildsRepository(this.databaseConnection);
    }

    createWarningRepository(): IWarningRepository {
        return new DatabaseWarningRepository(this.databaseConnection);
    }

    createCommandHashRepository(): ICommandHashRepository {
        return new DatabaseCommandHashRepository(this.databaseConnection);
    }
}

/**
 * Container de Injeção de Dependência
 * Gerencia a criação e o ciclo de vida de todos os serviços
 * Garante uma instância única de recursos caros (ex: conexão com o banco de dados)
 *
 * Padrão de uso:
 * ```ts
 * const container = new DIContainer(client);
 * await container.initialize();
 * const services = container.getServices();
 * ```
 */
export class DIContainer {
    // Instâncias Singleton
    private databaseConnection: IDatabaseConnection | null = null;
    private repositoryFactory: IRepositoryFactory | null = null;
    private flagsRepository: IFlagsRepository | null = null;
    private checkRepository: ICheckRepository | null = null;
    private guildsRepository: IGuildsRepository | null = null;
    private warningRepository: IWarningRepository | null = null;
    private commandHashRepository: ICommandHashRepository | null = null;
    private featureFlagsService: IFeatureFlagsService | null = null;
    private discordService: IDiscordService | null = null;
    private schedulerService: ISchedulerService | null = null;
    private n8nService: IN8nService | null = null;

    constructor(private client: Client) {}

    /**
     * Inicializa o container e todas as dependências
     * Deve ser chamado antes de usar o container
     */
    async initialize(): Promise<void> {
        // Inicializar conexão com o banco de dados
        this.databaseConnection = new DatabaseConnection();
        await this.databaseConnection.connect();

        // Criar a factory de repositório
        this.repositoryFactory = new RepositoryFactory(this.databaseConnection);

        // Inicializar o esquema
        this.checkRepository = this.repositoryFactory.createCheckRepository();
        await this.checkRepository.checkSchemas();

        // Inicializar os repositórios
        this.flagsRepository = this.repositoryFactory.createFlagsRepository();
        this.guildsRepository = this.repositoryFactory.createGuildsRepository();
        this.warningRepository = this.repositoryFactory.createWarningRepository();
        this.commandHashRepository = this.repositoryFactory.createCommandHashRepository();

        // Sincronizar servidores (guilds)
        await this.guildsRepository.syncGuilds();

        // Inicializar as flags de funcionalidade
        const allFlags = await this.flagsRepository.getAllFeatureFlags();
        await this.flagsRepository.checkEmptyFeatureFlags(
            Array.from(this.client.guilds.cache.values()).map((guild) => guild.id),
        );

        // Inicializar os serviços
        this.featureFlagsService = new FeatureFlagsService(allFlags, this.flagsRepository);
        this.n8nService = new N8nService(env.N8N_WEBHOOKS_TOKEN);

        const linkedinService = new LinkedinService();

        // Sub-serviços do Discord
        const eventsSubService = new EventsSubService(this.client);
        const messagesSubService = new MessagesSubService(
            this.client,
            this.featureFlagsService,
            linkedinService,
        );
        const rolesSubService = new RolesSubService();
        const classSubService = new ClassSubService(this.client);
        const commandsSubService = new CommandsSubService(this.commandHashRepository!);

        this.discordService = new DiscordService(
            eventsSubService,
            messagesSubService,
            rolesSubService,
            classSubService,
            commandsSubService,
        );

        // Componentes do Agendador (Scheduler) Modular
        const eventsCache = new Map<string, EventState>();
        const notificationDispatcher = new NotificationDispatcherService(this.warningRepository!);

        const eventProcessor = new EventProcessorService(
            this.featureFlagsService,
            notificationDispatcher,
            this.warningRepository!,
            eventsCache,
        );

        const metricsCollector = new MetricCollectorService(
            this.client,
            this.featureFlagsService,
            this.n8nService,
        );

        const cleanupManager = new CleanupManagerService(
            this.client,
            this.warningRepository!,
            eventsCache,
        );

        this.schedulerService = new SchedulerService(
            this.client,
            eventProcessor,
            metricsCollector,
            cleanupManager,
        );
    }

    /**
     * Encerra o container de forma graciosa e fecha os recursos
     */
    async shutdown(): Promise<void> {
        if (this.databaseConnection) {
            await this.databaseConnection.endConnection();
        }
    }

    // Métodos de acesso para os serviços (seguindo o padrão getter)

    getDatabaseConnection(): IDatabaseConnection {
        this.throwIfNotInitialized(this.databaseConnection, 'Database Connection');
        return this.databaseConnection!;
    }

    getRepositoryFactory(): IRepositoryFactory {
        this.throwIfNotInitialized(this.repositoryFactory, 'Repository Factory');
        return this.repositoryFactory!;
    }

    getFlagsRepository(): IFlagsRepository {
        this.throwIfNotInitialized(this.flagsRepository, 'Flags Repository');
        return this.flagsRepository!;
    }

    getCheckRepository(): ICheckRepository {
        this.throwIfNotInitialized(this.checkRepository, 'Check Repository');
        return this.checkRepository!;
    }

    getGuildsRepository(): IGuildsRepository {
        this.throwIfNotInitialized(this.guildsRepository, 'Guilds Repository');
        return this.guildsRepository!;
    }

    getWarningRepository(): IWarningRepository {
        this.throwIfNotInitialized(this.warningRepository, 'Warning Repository');
        return this.warningRepository!;
    }

    getCommandHashRepository(): ICommandHashRepository {
        this.throwIfNotInitialized(this.commandHashRepository, 'Command Hash Repository');
        return this.commandHashRepository!;
    }

    getFeatureFlagsService(): IFeatureFlagsService {
        this.throwIfNotInitialized(this.featureFlagsService, 'Feature Flags Service');
        return this.featureFlagsService!;
    }

    getDiscordService(): IDiscordService {
        this.throwIfNotInitialized(this.discordService, 'Discord Service');
        return this.discordService!;
    }

    getSchedulerService(): ISchedulerService {
        this.throwIfNotInitialized(this.schedulerService, 'Scheduler Service');
        return this.schedulerService!;
    }

    getN8nService(): IN8nService {
        this.throwIfNotInitialized(this.n8nService, 'N8n Service');
        return this.n8nService!;
    }

    /**
     * Retorna um objeto com todos os serviços para desestruturação conveniente
     * Uso: const { featureFlagsService, discordService } = container.getServices();
     */
    getServices(): {
        databaseConnection: IDatabaseConnection;
        repositoryFactory: IRepositoryFactory;
        flagsRepository: IFlagsRepository;
        checkRepository: ICheckRepository;
        guildsRepository: IGuildsRepository;
        warningRepository: IWarningRepository;
        commandHashRepository: ICommandHashRepository;
        featureFlagsService: IFeatureFlagsService;
        discordService: IDiscordService;
        schedulerService: ISchedulerService;
        n8nService: IN8nService;
    } {
        return {
            databaseConnection: this.getDatabaseConnection(),
            repositoryFactory: this.getRepositoryFactory(),
            flagsRepository: this.getFlagsRepository(),
            checkRepository: this.getCheckRepository(),
            guildsRepository: this.getGuildsRepository(),
            warningRepository: this.getWarningRepository(),
            commandHashRepository: this.getCommandHashRepository(),
            featureFlagsService: this.getFeatureFlagsService(),
            discordService: this.getDiscordService(),
            schedulerService: this.getSchedulerService(),
            n8nService: this.getN8nService(),
        };
    }

    /**
     * Auxiliar privado para garantir que o serviço esteja inicializado
     * Lança um erro se o serviço não estiver disponível
     */
    private throwIfNotInitialized(service: unknown, serviceName: string): void {
        if (!service) {
            throw new Error(`${serviceName} is not initialized. Call initialize() first.`);
        }
    }
}
