import type {
    IDiscordClassService,
    IDiscordCommandsService,
    IDiscordEventService,
    IDiscordMessageService,
    IDiscordRoleService,
    IDiscordService,
} from '../types/discord.interfaces.ts';

/**
 * DiscordService - Fachada (Facade) para todas as operações relacionadas ao Discord
 * Implementa a interface IDiscordService
 *
 * Responsabilidades:
 * - Agregar todos os sub-serviços do Discord
 * - Fornecer uma interface unificada para as operações do Discord
 * - Gerenciar o ciclo de vida das operações do Discord
 *
 * Padrão de Projeto (Design Pattern): Padrão Fachada (Facade Pattern)
 * Agrupa funcionalidades relacionadas de múltiplos serviços em uma única interface
 * Isso simplifica a API para os controladores/serviços
 *
 * SOLID:
 * - Responsabilidade Única (Single Responsibility): Agrega e delega para os sub-serviços
 * - Inversão de Dependência (Dependency Inversion): Depende das interfaces de serviço através de injeção via construtor
 * - Segregação de Interface (Interface Segregation): Cada sub-serviço possui uma interface específica
 */
export default class DiscordService implements IDiscordService {
    // Propriedades somente leitura para evitar reatribuições acidentais
    readonly events: IDiscordEventService;
    readonly messages: IDiscordMessageService;
    readonly roles: IDiscordRoleService;
    readonly class: IDiscordClassService;
    readonly commands: IDiscordCommandsService;

    /**
     * Constrói a fachada DiscordService com os sub-serviços injetados
     *
     * @param events - Sub-serviço para gerenciamento de eventos
     * @param messages - Sub-serviço para operações de mensagens
     * @param roles - Sub-serviço para gerenciamento de cargos (roles)
     * @param classSubService - Sub-serviço para gerenciamento de turmas/canais (injetado como classSubService para evitar conflito com palavra-chave reservada)
     * @param commands - Sub-serviço para registro de comandos
     */
    constructor(
        events: IDiscordEventService,
        messages: IDiscordMessageService,
        roles: IDiscordRoleService,
        classSubService: IDiscordClassService,
        commands: IDiscordCommandsService,
    ) {
        this.events = events;
        this.messages = messages;
        this.roles = roles;
        this.class = classSubService;
        this.commands = commands;
    }
}
