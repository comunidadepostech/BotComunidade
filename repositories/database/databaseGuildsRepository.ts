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
 *
 * Padrão de Projeto (Design Pattern): Cache em memória de mapeamentos de servidores para buscas O(1)
 * Isso evita consultas repetitivas ao banco de dados para dados de servidores acessados com frequência
 *
 * SOLID: Responsabilidade Única - apenas lida com o acesso a dados de servidores
 */
export default class DatabaseGuildsRepository implements IGuildsRepository {
    /**
     * Mapas separados para evitar colisões de chaves entre nomes de servidores e IDs.
     */
    private courseToGuild = new Map<string, string>();
    private guildToCourse = new Map<string, string>();

    constructor(private databaseConnection: IDatabaseConnection) {}

    /**
     * Sincroniza o cache de servidores do bot com o banco de dados
     * Cria mapeamentos separados para buscas rápidas em ambas as direções
     * Chamado durante a inicialização para carregar todos os dados dos servidores
     */
    async syncGuilds(): Promise<void> {
        try {
            const pool = this.databaseConnection.getPool();

            // Buscar todos os mapeamentos de servidores do banco de dados
            const [rows] = await pool.execute<RowDataPacket[]>(
                'SELECT guild_name, guild_id FROM guilds',
            );

            // Limpar o cache anterior
            this.courseToGuild.clear();
            this.guildToCourse.clear();

            // Construir os mapeamentos
            for (const row of rows) {
                const guildName = row['guild_name'];
                const guildId = row['guild_id'];

                // Mapear nome do curso para o ID do servidor
                this.courseToGuild.set(guildName, guildId);

                // Mapear ID do servidor para o nome do curso (busca reversa)
                this.guildToCourse.set(guildId, guildName);
            }

            console.log(`Guilds synchronized: ${rows.length} guilds loaded`);
        } catch (error) {
            throw new DatabaseError('Failed to synchronize guilds', error as Error, 'syncGuilds');
        }
    }

    /**
     * Recupera o ID do servidor para um determinado código/nome de curso
     * Usa cache em memória para busca O(1)
     *
     * @param course - Código/nome do curso (ex: "POSTECH", "FIAP")
     * @returns ID do servidor se encontrado, undefined caso contrário
     */
    getGuildIdByCourse(course: string): string | undefined {
        return this.courseToGuild.get(course);
    }

    /**
     * Recupera o código/nome do curso para um determinado ID de servidor
     * Usa cache em memória para busca O(1)
     *
     * @param guildId - ID do Servidor do Discord
     * @returns Código do curso se encontrado, undefined caso contrário
     */
    getGuildCourseById(guildId: string): string | undefined {
        return this.guildToCourse.get(guildId);
    }
}
