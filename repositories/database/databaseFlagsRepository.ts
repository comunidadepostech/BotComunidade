import type { RowDataPacket } from 'mysql2/promise';
import type { IDatabaseConnection, IFlagsRepository } from '../../types/repository.interfaces.ts';
import type { GlobalFlags, IGuildFlags } from '../../types/featureFlags.types.ts';
import { DEFAULT_FEATURE_FLAGS } from '../../constants/flagsConstants.ts';
import { DatabaseError, NotFoundError } from '../../types/errors.ts';

/**
 * DatabaseFlagsRepository - Gerencia a persistência de flags de funcionalidade no banco de dados
 * Implementa a interface IFlagsRepository para inversão de dependência
 *
 * Responsabilidades:
 * - Ler/escrever flags de funcionalidade para/do banco de dados
 * - Garantir a consistência das flags entre os servidores (guilds)
 * - Lidar com a sincronização de flags quando novas flags são adicionadas
 *
 * SOLID: Responsabilidade Única - apenas lida com o acesso a dados de flags
 */
export default class DatabaseFlagsRepository implements IFlagsRepository {
    constructor(private databaseConnection: IDatabaseConnection) {}

    /**
     * Recupera as flags de um servidor específico
     * Retorna null se o servidor não tiver flags configuradas
     */
    private async getGuildFeatureFlags(guildId: string): Promise<IGuildFlags | null> {
        try {
            const pool = this.databaseConnection.getPool();
            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT flags FROM featureFlags WHERE guild_id = ?',
                [guildId],
            );

            const row = rows[0];
            if (!row) {
                return null;
            }

            // As flags são armazenadas como string JSON no banco de dados
            const flagsJson = row['flags'];
            return typeof flagsJson === 'string' ? JSON.parse(flagsJson) : flagsJson;
        } catch (error) {
            throw new DatabaseError(
                `Failed to retrieve feature flags for guild ${guildId}`,
                error as Error,
                'getGuildFeatureFlags',
            );
        }
    }

    /**
     * Recupera todas as flags de funcionalidade de todos os servidores
     * Retorna um objeto vazio se não existirem flags
     */
    async getAllFeatureFlags(): Promise<GlobalFlags> {
        try {
            const pool = this.databaseConnection.getPool();
            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT guild_id, flags FROM featureFlags',
            );

            const flags: GlobalFlags = {};

            for (const row of rows) {
                const guildId = row['guild_id'];
                const flagsJson = row['flags'];
                // Analisar (parse) as flags JSON do banco de dados
                flags[guildId] = typeof flagsJson === 'string' ? JSON.parse(flagsJson) : flagsJson;
            }

            return flags;
        } catch (error) {
            throw new DatabaseError(
                'Failed to retrieve all feature flags',
                error as Error,
                'getAllFeatureFlags',
            );
        }
    }

    /**
     * Atualiza o valor de uma única flag de funcionalidade para um servidor
     * Lança um erro se a flag não existir
     */
    async updateFeatureFlag(guildId: string, flagName: string, value: boolean): Promise<void> {
        try {
            const guildFlags = await this.getGuildFeatureFlags(guildId);

            if (!guildFlags) {
                throw new NotFoundError(`Feature flags not found for guild ${guildId}`, 'Guild');
            }

            if (!(flagName in guildFlags)) {
                throw new NotFoundError(
                    `Feature flag '${flagName}' not found in guild ${guildId}`,
                    'FeatureFlag',
                );
            }

            // Atualizar o valor da flag
            guildFlags[flagName as keyof IGuildFlags] = value;

            const pool = this.databaseConnection.getPool();
            await pool.query('UPDATE featureFlags SET flags = ? WHERE guild_id = ?;', [
                JSON.stringify(guildFlags),
                guildId,
            ]);
        } catch (error) {
            if (error instanceof (NotFoundError || DatabaseError)) {
                throw error;
            }
            throw new DatabaseError(
                `Failed to update feature flag '${flagName}' for guild ${guildId}`,
                error as Error,
                'updateFeatureFlag',
            );
        }
    }

    /**
     * Cria uma nova flag de funcionalidade e a adiciona a todos os servidores existentes
     * Usado quando novas flags são introduzidas no sistema
     */
    private async createFeatureFlag(name: string, defaultValue: boolean): Promise<void> {
        try {
            const allFlags = await this.getAllFeatureFlags();
            const pool = this.databaseConnection.getPool();

            for (const guildId in allFlags) {
                allFlags[guildId]![name as keyof IGuildFlags] = defaultValue;
                await pool.query('UPDATE featureFlags SET flags = ? WHERE guild_id = ?;', [
                    JSON.stringify(allFlags[guildId]),
                    guildId,
                ]);
            }
        } catch (error) {
            throw new DatabaseError(
                `Failed to create feature flag '${name}'`,
                error as Error,
                'createFeatureFlag',
            );
        }
    }

    /**
     * Garante que as flags de funcionalidade estejam sincronizadas para todos os IDs de servidor fornecidos
     * Cria servidores ausentes com flags padrão
     * Adiciona flags ausentes aos servidores existentes
     * Remove flags obsoletas de todos os servidores
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    async checkEmptyFeatureFlags(guildIds: string[]): Promise<void> {
        try {
            const databaseFlags = await this.getAllFeatureFlags();

            for (const guildId of guildIds) {
                // Criar flags padrão se o servidor não existir
                if (!databaseFlags[guildId]) {
                    await this.saveDefaultFeatureFlags(guildId);
                    databaseFlags[guildId] = { ...DEFAULT_FEATURE_FLAGS };
                }

                const guildFlags = databaseFlags[guildId]!;

                // Encontrar flags que existem nos padrões, mas não no banco de dados (novas flags)
                const missingFlags = Object.keys(DEFAULT_FEATURE_FLAGS).filter(
                    (flag) => !(flag in guildFlags),
                );

                // Encontrar flags que existem no banco de dados, mas não nos padrões (flags obsoletas)
                const obsoleteFlags = Object.keys(guildFlags).filter(
                    (flag) => !(flag in DEFAULT_FEATURE_FLAGS),
                );

                // Adicionar flags ausentes a todos os servidores
                if (missingFlags.length > 0) {
                    for (const flag of missingFlags) {
                        const defaultValue =
                            DEFAULT_FEATURE_FLAGS[flag as keyof typeof DEFAULT_FEATURE_FLAGS];
                        await this.createFeatureFlag(flag, defaultValue);
                    }
                }

                // Remover flags obsoletas de todos os servidores
                if (obsoleteFlags.length > 0) {
                    for (const flag of obsoleteFlags) {
                        await this.deleteFeatureFlag(flag);
                    }
                }
            }
        } catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            throw new DatabaseError(
                'Failed to check empty feature flags',
                error as Error,
                'checkEmptyFeatureFlags',
            );
        }
    }

    /**
     * Remove uma flag de funcionalidade de todos os servidores
     * Usado ao descontinuar flags do sistema
     */
    private async deleteFeatureFlag(flag: string): Promise<void> {
        try {
            const allFlags = await this.getAllFeatureFlags();
            const pool = this.databaseConnection.getPool();

            for (const guildId in allFlags) {
                delete allFlags[guildId]![flag as keyof IGuildFlags];
                await pool.query('UPDATE featureFlags SET flags = ? WHERE guild_id = ?;', [
                    JSON.stringify(allFlags[guildId]),
                    guildId,
                ]);
            }
        } catch (error) {
            throw new DatabaseError(
                `Failed to delete feature flag '${flag}'`,
                error as Error,
                'deleteFeatureFlag',
            );
        }
    }

    /**
     * Remove todas as flags de funcionalidade de um servidor
     * Chamado quando o bot é removido de um servidor
     */
    async deleteGuildFeatureFlags(guildId: string): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();
            await pool.query('DELETE FROM featureFlags WHERE guild_id = ?;', [guildId]);
        } catch (error) {
            throw new DatabaseError(
                `Failed to delete feature flags for guild ${guildId}`,
                error as Error,
                'deleteGuildFeatureFlags',
            );
        }
    }

    /**
     * Inicializa as flags de funcionalidade padrão para um novo servidor
     * Chamado quando o bot é adicionado a um novo servidor
     */
    async saveDefaultFeatureFlags(guildId: string): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();
            await pool.query('INSERT INTO featureFlags (guild_id, flags) VALUES (?, ?);', [
                guildId,
                JSON.stringify(DEFAULT_FEATURE_FLAGS),
            ]);
        } catch (error) {
            throw new DatabaseError(
                `Failed to save default feature flags for guild ${guildId}`,
                error as Error,
                'saveDefaultFeatureFlags',
            );
        }
    }
}
