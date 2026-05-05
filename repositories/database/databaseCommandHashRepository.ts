import type { RowDataPacket } from 'mysql2/promise';
import type {
    IDatabaseConnection,
    ICommandHashRepository,
} from '../../types/repository.interfaces.ts';
import type { CommandHashMap } from '../../types/commandHash.types.ts';
import { DatabaseError } from '../../types/errors.ts';

/**
 * DatabaseCommandHashRepository - Gerencia a persistência de hashes de comandos no banco de dados
 * Implementa a interface ICommandHashRepository para inversão de dependência
 *
 * Responsabilidades:
 * - Ler/escrever hashes de comandos para/do banco de dados
 * - Gerenciar a sincronização de hashes de comando
 * - Rastrear mudanças em comandos
 */
export default class DatabaseCommandHashRepository implements ICommandHashRepository {
    constructor(private databaseConnection: IDatabaseConnection) {}

    /**
     * Recupera todos os hashes de comandos do banco de dados
     */
    async getAllCommandHashes(): Promise<CommandHashMap> {
        try {
            const pool = this.databaseConnection.getPool();
            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT command_name, file_hash FROM command_hashes',
            );

            const hashes: CommandHashMap = {};
            for (const row of rows) {
                hashes[row['command_name']] = row['file_hash'];
            }

            return hashes;
        } catch (error) {
            throw new DatabaseError(
                'Failed to retrieve command hashes',
                error as Error,
                'getAllCommandHashes',
            );
        }
    }

    /**
     * Salva o hash de um comando
     */
    async saveCommandHash(commandName: string, fileHash: string): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();
            await pool.query(
                'INSERT INTO command_hashes (command_name, file_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE file_hash = VALUES(file_hash)',
                [commandName, fileHash],
            );
        } catch (error) {
            throw new DatabaseError(
                `Failed to save hash for command ${commandName}`,
                error as Error,
                'saveCommandHash',
            );
        }
    }

    /**
     * Salva múltiplos hashes de comando
     */
    async saveCommandHashes(hashes: CommandHashMap): Promise<void> {
        try {
            const entries = Object.entries(hashes);

            if (entries.length === 0) {
                return;
            }

            const pool = this.databaseConnection.getPool();

            // Usar batch INSERT com ON DUPLICATE KEY UPDATE para melhor performance
            const placeholders = entries.map(() => '(?, ?)').join(',');
            const values = entries.flatMap(([name, hash]) => [name, hash]);

            await pool.query(
                `INSERT INTO command_hashes (command_name, file_hash) VALUES ${placeholders} 
                 ON DUPLICATE KEY UPDATE file_hash = VALUES(file_hash)`,
                values,
            );
        } catch (error) {
            throw new DatabaseError(
                'Failed to save command hashes',
                error as Error,
                'saveCommandHashes',
            );
        }
    }

    /**
     * Deleta o hash de um comando
     */
    async deleteCommandHash(commandName: string): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();
            await pool.query('DELETE FROM command_hashes WHERE command_name = ?', [commandName]);
        } catch (error) {
            throw new DatabaseError(
                `Failed to delete hash for command ${commandName}`,
                error as Error,
                'deleteCommandHash',
            );
        }
    }

    /**
     * Deleta múltiplos hashes de comando
     */
    async deleteCommandHashes(commandNames: string[]): Promise<void> {
        try {
            if (commandNames.length === 0) {
                return;
            }

            const pool = this.databaseConnection.getPool();
            const placeholders = commandNames.map(() => '?').join(',');
            await pool.query(
                `DELETE FROM command_hashes WHERE command_name IN (${placeholders})`,
                commandNames,
            );
        } catch (error) {
            throw new DatabaseError(
                'Failed to delete command hashes',
                error as Error,
                'deleteCommandHashes',
            );
        }
    }

    /**
     * Limpa todos os hashes de comando
     */
    async clearAllCommandHashes(): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();
            await pool.query('DELETE FROM command_hashes');
        } catch (error) {
            throw new DatabaseError(
                'Failed to clear command hashes',
                error as Error,
                'clearAllCommandHashes',
            );
        }
    }
}
