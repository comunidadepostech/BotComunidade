/**
 * Camada de Interface de Repositório - Abstrai o acesso ao banco de dados
 * Segue o Padrão de Repositório (Repository Pattern) e o Princípio de Inversão de Dependência
 * Todo acesso a dados deve passar por estas interfaces, não por chamadas diretas ao banco de dados
 */

import type { Pool } from 'mysql2/promise';
import type { GlobalFlags } from './featureFlags.types.ts';

/**
 * Interface para gerenciamento de conexão com o banco de dados
 * Encapsula o ciclo de vida do pool do MySQL
 */
export interface IDatabaseConnection {
    /**
     * Estabelece conexão com o banco de dados
     * Deve ser chamado durante a inicialização da aplicação
     */
    connect(): Promise<void>;

    /**
     * Recupera o pool de conexões
     * Usado pelos repositórios para executar consultas
     */
    getPool(): Pool;

    /**
     * Fecha todas as conexões no pool
     * Deve ser chamado durante o encerramento gracioso (graceful shutdown)
     */
    endConnection(): Promise<void>;
}

/**
 * Interface para o repositório de flags de funcionalidade (feature flags)
 * Gerencia a persistência e recuperação de flags de funcionalidade
 */
export interface IFlagsRepository {
    /**
     * Recupera todas as flags de funcionalidade de todos os servidores (guilds)
     * Retorna um mapa de guildId -> flags
     */
    getAllFeatureFlags(): Promise<GlobalFlags>;

    /**
     * Inicializa as flags de funcionalidade padrão para um novo servidor
     */
    saveDefaultFeatureFlags(guildId: string): Promise<void>;

    /**
     * Atualiza o valor de uma única flag de funcionalidade
     */
    updateFeatureFlag(guildId: string, flagName: string, value: boolean): Promise<void>;

    /**
     * Exclui todas as flags de funcionalidade de um servidor
     * Chamado quando o bot é removido do servidor
     */
    deleteGuildFeatureFlags(guildId: string): Promise<void>;

    /**
     * Verifica e cria as flags padrão para servidores que não as possuem
     */
    checkEmptyFeatureFlags(guildIds: string[]): Promise<void>;
}

/**
 * Interface para gerenciamento do esquema do banco de dados
 * Lida com a criação e inicialização de tabelas
 */
export interface ICheckRepository {
    /**
     * Verifica se todas as tabelas necessárias existem e as cria se necessário
     */
    checkSchemas(): Promise<void>;
}

/**
 * Interface para gerenciamento de servidores (guilds)
 * Lida com a configuração e sincronização de servidores
 */
export interface IGuildsRepository {
    /**
     * Sincroniza o cache de servidores do bot com o banco de dados
     * Garante que o banco de dados esteja em sincronia com o estado do Discord
     */
    syncGuilds(): Promise<void>;

    /**
     * Recupera o ID do servidor para um nome de curso específico
     * Usado para mapear códigos de curso para servidores do Discord
     */
    getGuildIdByCourse(courseName: string): string | undefined;
}

/**
 * Interface para gerenciamento de avisos/alertas
 * Lida com o histórico de avisos e rastreamento de entrega
 */
export interface IWarningRepository {
    /**
     * Registra um aviso emitido para um usuário
     */
    saveWarning(guildId: string, userId: string, message: string, timestamp: Date): Promise<void>;

    /**
     * Recupera avisos para um usuário específico
     */
    getUserWarnings(guildId: string, userId: string): Promise<WarningRecord[]>;

    /**
     * Registra uma mensagem de aviso enviada para um canal
     */
    save(messageId: string, channelId: string): Promise<void>;

    /**
     * Verifica mensagens de aviso, opcionalmente filtradas por canal
     */
    check(channelId?: string): Promise<any>;

    /**
     * Exclui mensagens de aviso rastreadas
     */
    delete(): Promise<void>;
}

/**
 * Estrutura de dados para registros de aviso
 */
export interface WarningRecord {
    id: string;
    guildId: string;
    userId: string;
    message: string;
    timestamp: Date;
}

/**
 * Interface Factory para criar instâncias de repositório
 * Centraliza a criação de repositórios e o gerenciamento de dependências
 */
export interface IRepositoryFactory {
    /**
     * Cria e retorna uma instância do repositório de flags
     */
    createFlagsRepository(): IFlagsRepository;

    /**
     * Cria e retorna uma instância do repositório de verificação (check)
     */
    createCheckRepository(): ICheckRepository;

    /**
     * Cria e retorna uma instância do repositório de servidores (guilds)
     */
    createGuildsRepository(): IGuildsRepository;

    /**
     * Cria e retorna uma instância do repositório de avisos
     */
    createWarningRepository(): IWarningRepository;
}
