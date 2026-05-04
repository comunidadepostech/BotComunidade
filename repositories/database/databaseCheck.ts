import type { IDatabaseConnection, ICheckRepository } from '../../types/repository.interfaces.ts';
import { DatabaseError } from '../../types/errors.ts';

/**
 * DatabaseCheckRepository - Gerencia a inicialização do esquema do banco de dados
 * Implementa a interface ICheckRepository para inversão de dependência
 *
 * Responsabilidades:
 * - Criar tabelas se elas não existirem
 * - Garantir que o esquema do banco de dados esteja devidamente inicializado
 *
 * SOLID: Responsabilidade Única - apenas lida com a inicialização do esquema
 */
export default class DatabaseCheckRepository implements ICheckRepository {
    constructor(private databaseConnection: IDatabaseConnection) {}

    /**
     * Verifica se todas as tabelas necessárias existem e as cria se necessário
     * Usa CREATE TABLE IF NOT EXISTS para idempotência
     *
     * Tabelas criadas:
     * - featureFlags: Armazena as alternâncias de funcionalidades (feature toggles) por servidor
     * - discord_event_warnings: Rastreia mensagens de aviso de eventos para limpeza
     */
    async checkSchemas(): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();

            // Criar a tabela featureFlags se ela não existir
            await pool.query(`CREATE TABLE IF NOT EXISTS featureFlags (
        guild_id VARCHAR(22) PRIMARY KEY,
        flags JSON NOT NULL
      );`);

            // Criar a tabela discord_event_warnings se ela não existir
            await pool.query(`CREATE TABLE IF NOT EXISTS discord_event_warnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        channel_id VARCHAR(19) NOT NULL,
        message_id VARCHAR(19) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`);

            console.log('Database schema check completed successfully');
        } catch (error) {
            throw new DatabaseError(
                'Failed to check/create database schemas',
                error as Error,
                'checkSchemas',
            );
        }
    }
}
