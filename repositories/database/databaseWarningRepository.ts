import type { RowDataPacket } from 'mysql2/promise';
import type {
    IDatabaseConnection,
    IWarningRepository,
    WarningRecord,
} from '../../types/repository.interfaces.ts';
import { DatabaseError } from '../../types/errors.ts';

/**
 * Estrutura da linha do banco de dados para mensagens de aviso
 * Usada internamente para operações de banco de dados
 */
interface WarningMessageRow extends RowDataPacket {
    message_id: string;
    channel_id: string;
}

/**
 * DatabaseWarningRepository - Gerencia o rastreamento de mensagens de aviso
 * Implementa a interface IWarningRepository para inversão de dependência
 *
 * Responsabilidades:
 * - Rastrear mensagens de aviso de eventos do Discord
 * - Suportar operações de limpeza de mensagens
 * - Consultar histórico de avisos por servidor/usuário
 *
 * SOLID: Responsabilidade Única - apenas lida com o acesso a dados de avisos
 */
export default class DatabaseWarningRepository implements IWarningRepository {
    constructor(private databaseConnection: IDatabaseConnection) {}

    /**
     * Registra uma mensagem de aviso para rastreamento futuro
     * Normalmente usado para rastrear mensagens de aviso que precisam de limpeza
     *
     * @param guildId - ID do servidor onde o aviso foi enviado
     * @param userId - ID do usuário que recebeu o aviso (também pode ser usado para rastreamento de canal)
     * @param message - O conteúdo/identificador da mensagem de aviso
     * @param timestamp - Quando o aviso foi emitido
     */
    async saveWarning(
        guildId: string,
        userId: string,
        message: string,
        _timestamp: Date,
    ): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();

            await pool.execute(
                'INSERT INTO discord_event_warnings (channel_id, message_id) VALUES (?, ?)',
                [userId, message],
            );
        } catch (error) {
            throw new DatabaseError(
                `Failed to save warning for guild ${guildId}, user ${userId}`,
                error as Error,
                'saveWarning',
            );
        }
    }

    /**
     * Recupera todos os avisos de um usuário específico em um servidor
     * Pode ser usado para fins de histórico/moderação de avisos
     *
     * @param guildId - ID do servidor para filtrar os avisos
     * @param userId - ID do usuário para recuperar os avisos
     * @returns Array de registros de aviso para o usuário
     */
    async getUserWarnings(guildId: string, userId: string): Promise<WarningRecord[]> {
        try {
            const pool = this.databaseConnection.getPool();

            const [rows] = await pool.execute<WarningMessageRow[]>(
                'SELECT * FROM discord_event_warnings WHERE channel_id = ?',
                [userId],
            );

            return rows.map((row) => ({
                id: row.message_id,
                guildId,
                userId,
                message: row.message_id,
                timestamp: new Date(),
            }));
        } catch (error) {
            throw new DatabaseError(
                `Failed to retrieve warnings for guild ${guildId}, user ${userId}`,
                error as Error,
                'getUserWarnings',
            );
        }
    }

    /**
     * Alias para saveWarningMessage - usado pelo SchedulerService
     */
    async save(messageId: string, channelId: string): Promise<void> {
        return this.saveWarningMessage(messageId, channelId);
    }

    /**
     * Alias para getChannelWarning/getAllWarnings - usado pelo SchedulerService
     */
    async check(channelId?: string): Promise<WarningMessageRow | WarningMessageRow[] | undefined> {
        if (channelId) {
            return this.getChannelWarning(channelId);
        }
        return this.getAllWarnings();
    }

    /**
     * Alias para deleteAllWarnings - usado pelo SchedulerService
     */
    async delete(): Promise<void> {
        return this.deleteAllWarnings();
    }

    /**
     * Salva uma mensagem de aviso específica para rastreamento
     * Usado pelo sistema de aviso de eventos para rastrear mensagens que precisam de limpeza
     *
     * @param messageId - ID da mensagem do Discord
     * @param channelId - ID do canal do Discord onde a mensagem foi enviada
     */
    async saveWarningMessage(messageId: string, channelId: string): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();

            await pool.execute(
                'INSERT INTO discord_event_warnings (channel_id, message_id) VALUES (?, ?)',
                [channelId, messageId],
            );
        } catch (error) {
            throw new DatabaseError(
                `Failed to save warning message ${messageId}`,
                error as Error,
                'saveWarningMessage',
            );
        }
    }

    /**
     * Remove todos os registros de mensagens de aviso do banco de dados
     * Usado para operações de limpeza
     */
    async deleteAllWarnings(): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();
            await pool.execute('TRUNCATE TABLE discord_event_warnings');
        } catch (error) {
            throw new DatabaseError(
                'Failed to delete all warnings',
                error as Error,
                'deleteAllWarnings',
            );
        }
    }

    /**
     * Recupera a mensagem de aviso de um canal específico
     *
     * @param channelId - ID do canal do Discord
     * @returns Linha da mensagem de aviso se encontrada, undefined caso contrário
     */
    async getChannelWarning(channelId: string): Promise<WarningMessageRow | undefined> {
        try {
            const pool = this.databaseConnection.getPool();

            const [rows] = await pool.execute<WarningMessageRow[]>(
                'SELECT message_id FROM discord_event_warnings WHERE channel_id = ?',
                [channelId],
            );

            return rows[0];
        } catch (error) {
            throw new DatabaseError(
                `Failed to retrieve warning for channel ${channelId}`,
                error as Error,
                'getChannelWarning',
            );
        }
    }

    /**
     * Recupera todas as mensagens de aviso no sistema
     *
     * @returns Array de todas as linhas de mensagens de aviso
     */
    async getAllWarnings(): Promise<WarningMessageRow[]> {
        try {
            const pool = this.databaseConnection.getPool();

            const [rows] = await pool.execute<WarningMessageRow[]>(
                'SELECT * FROM discord_event_warnings',
            );

            return rows;
        } catch (error) {
            throw new DatabaseError(
                'Failed to retrieve all warnings',
                error as Error,
                'getAllWarnings',
            );
        }
    }
}
