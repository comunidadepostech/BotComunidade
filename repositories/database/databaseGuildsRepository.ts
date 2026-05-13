import type { RowDataPacket } from 'mysql2/promise';
import type { IDatabaseConnection, IGuildsRepository } from '../../types/repository.interfaces.ts';
import { DatabaseError } from '../../types/errors.ts';

/**
 * DatabaseGuildsRepository - Gerencia a configuração de servidores (guilds)
 * Implementa a interface IGuildsRepository para inversão de dependência
 *
 * Responsabilidades:
 * - Sincronizar informações dos servidores a partir do banco de dados
 * - Mapear IDs de servidores para códigos de cursos e vice-versa
 * - Fornecer buscas rápidas usando cache em memória
 */
export default class DatabaseGuildsRepository implements IGuildsRepository {
    /**
     * Mapas separados para evitar colisões de chaves entre nomes de servidores e IDs.
     */
    private guilds = new Map<
        string,
        { clusters: string[]; guild_name: string; guild_id: string }
    >();

    constructor(private databaseConnection: IDatabaseConnection) { }

    /**
     * Sincroniza os dados dos servidores com o banco de dados
     * Chamado durante a inicialização para carregar todos os dados dos servidores
     */
    async syncGuilds(): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();

            console.log('Starting guild synchronization from database...');

            // Buscar todos os mapeamentos de servidores do banco de dados
            const [rows] = await pool.execute<RowDataPacket[]>(
                'SELECT guild_id, guild_name, clusters FROM guilds',
            );

            console.log(`Retrieved ${rows.length} guilds from database`);

            // Limpar o cache anterior
            this.guilds.clear();

            // Construir os mapeamentos
            for (const row of rows) {
                const guildName = row['guild_name'];
                const guildId = row['guild_id'];
                const clusters = row['clusters'];

                if (!guildName || !guildId || !clusters) {
                    console.warn(
                        `Skipping invalid guild row: guild_name=${guildName}, guild_id=${guildId}, clusters=${clusters}`,
                    );
                    continue;
                }

                // Mapear ID do servidor para o nome do curso e o cluster
                this.guilds.set(guildId, {
                    clusters: clusters.split(', '),
                    guild_name: guildName,
                    guild_id: guildId,
                });

                console.debug(`Loaded guild: ${guildName} (${guildId}) with clusters: ${clusters}`);
            }

            console.log(
                `Guild synchronization completed: ${this.guilds.size} guilds loaded into cache`,
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Failed to execute guild synchronization query: ${errorMessage}`);
            throw new DatabaseError('Failed to synchronize guilds', error as Error, 'syncGuilds');
        }
    }

    /**
     * Recupera o ID do servidor para um determinado código/nome de curso
     *
     * @param course - Código/nome do curso (ex: "SOAT", "ADJT")
     * @returns ID do servidor se encontrado, undefined caso contrário
     */
    getGuildIdByCourse(course: string): string | undefined {
        return this.guilds.values().find((guild_data) => guild_data.guild_name === course)
            ?.guild_id;
    }

    /**
     * Recupera o código/nome do curso para um determinado ID de servidor
     *
     * @param guildId - ID do Servidor do Discord
     * @returns Código do curso se encontrado, undefined caso contrário
     */
    getGuildCourseById(guildId: string): string | undefined {
        return this.guilds.get(guildId)?.guild_name;
    }

    /**
     * Recupera o(s) ID(s) do servidor(es) para um determinado cluster
     *
     * @param course - Cluster (ex: "Dev")
     * @returns ID do servidor se encontrado, undefined caso contrário
     */
    getGuildIdsByCluster(targetCluster: string): string[] {
        return Array.from(this.guilds.values())
            .filter((guild_data) =>
                guild_data.clusters.find((cluster) => cluster === targetCluster),
            )
            .map((guild_data) => guild_data.guild_id);
    }

    /**
     * Insere ou atualiza uma guild no banco de dados
     * Útil para inicialização ou sincronização de dados
     *
     * @param guildId - ID do servidor do Discord
     * @param guildName - Nome/código do curso (ex: "SOAT", "ADJT")
     * @param clusters - Clusters separados por vírgula (ex: "Dev, DevOps")
     */
    async addOrUpdateGuild(
        guildId: string,
        guildName: string,
        clusters: string,
    ): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();

            const query = `
                INSERT INTO guilds (guild_id, guild_name, clusters)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    guild_name = VALUES(guild_name),
                    clusters = VALUES(clusters)
            `;

            await pool.execute(query, [guildId, guildName, clusters]);
            console.log(
                `Guild added/updated: ${guildName} (${guildId}) with clusters: ${clusters}`,
            );

            // Atualizar o cache em memória também
            this.guilds.set(guildId, {
                guild_id: guildId,
                guild_name: guildName,
                clusters: clusters.split(', '),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(
                `Failed to add/update guild ${guildId} (${guildName}): ${errorMessage}`,
            );
            throw new DatabaseError(
                'Failed to add/update guild',
                error as Error,
                'addOrUpdateGuild',
            );
        }
    }
}