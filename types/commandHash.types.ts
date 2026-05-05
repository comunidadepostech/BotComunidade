/**
 * Tipos relacionados ao sistema de verificação de hash de comandos
 * Permite rastrear e atualizar apenas os comandos que sofreram alterações
 */

/**
 * Representa o hash de um comando armazenado no banco de dados
 */
export interface CommandHashRecord {
    command_name: string;
    file_hash: string;
    last_updated: Date;
}

/**
 * Mapa de nome do comando para seu hash
 */
export type CommandHashMap = Record<string, string>;

/**
 * Resultado da comparação de hashes entre sistema de arquivos e banco de dados
 */
export interface CommandHashComparisonResult {
    /**
     * Comandos que foram modificados (hash diferente)
     */
    modified: string[];

    /**
     * Comandos que foram deletados (existem no DB mas não no filesystem)
     */
    deleted: string[];

    /**
     * Comandos que não foram alterados
     */
    unchanged: string[];

    /**
     * Comandos novos (existem no filesystem mas não no DB)
     */
    new: string[];
}
