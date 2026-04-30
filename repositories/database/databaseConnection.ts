import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import { MySQLdatabaseConfig } from '../../infrastructure/dataBaseConfig.ts';
import type { IDatabaseConnection } from '../../types/repository.interfaces.ts';
import { DatabaseError } from '../../types/errors.ts';

/**
 * DatabaseConnection - Gerencia o ciclo de vida do pool de conexões MySQL
 * Implementa a interface IDatabaseConnection para inversão de dependência
 *
 * Responsabilidades:
 * - Criar e manter o pool de conexões
 * - Lidar com a inicialização e limpeza da conexão
 * - Fornecer acesso ao pool para os repositórios
 *
 * SOLID: Responsabilidade Única - apenas gerencia o ciclo de vida da conexão com o banco de dados
 */
export default class DatabaseConnection implements IDatabaseConnection {
    private pool: Pool | null = null;

    constructor() {}

    /**
     * Estabelece conexão com o banco de dados MySQL
     * Utiliza um pool de conexões para melhor desempenho
     * Verifica se a conexão está funcionando antes de retornar
     */
    async connect(): Promise<void> {
        try {
            if (!this.pool) {
                this.pool = mysql.createPool(MySQLdatabaseConfig);
                // Verificar se a conexão funciona
                const connection = await this.pool.getConnection();
                connection.release();
                console.log('Database connection pool established');
            }
        } catch (error) {
            throw new DatabaseError(
                'Failed to establish database connection',
                error as Error,
                'connect',
            );
        }
    }

    /**
     * Recupera o pool de conexões
     * Garante que o pool esteja inicializado antes de retornar
     * Lança um erro se o pool não estiver inicializado
     */
    getPool(): Pool {
        if (!this.pool) {
            throw new DatabaseError(
                'Database connection pool not initialized. Call connect() first.',
                undefined,
                'getPool',
            );
        }
        return this.pool;
    }

    /**
     * Fecha todas as conexões no pool
     * Deve ser chamado durante o encerramento gracioso (graceful shutdown)
     * Garante que os recursos do banco de dados sejam liberados corretamente
     */
    async endConnection(): Promise<void> {
        try {
            if (!this.pool) {
                throw new DatabaseError(
                    'Database connection pool not initialized',
                    undefined,
                    'endConnection',
                );
            }
            await this.pool.end();
            console.log('Database connection pool closed');
        } catch (error) {
            throw new DatabaseError(
                'Failed to close database connection',
                error as Error,
                'endConnection',
            );
        }
    }
}
