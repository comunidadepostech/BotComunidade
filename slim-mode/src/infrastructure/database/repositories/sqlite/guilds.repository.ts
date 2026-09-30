import { eq, sql } from 'drizzle-orm';
import type IGuildsRepository from '../../../../types/repositories/guildsRepository.interface';
import type { SqliteDatabase } from '../../sqlite.client.ts';
import { guilds } from '../../../../db/sqlite.schema.ts';

export default class SqliteGuildsRepository implements IGuildsRepository {
    constructor(private db: SqliteDatabase) {}

    async getGuildIdByCourse(course: string): Promise<{ guild_id: string } | null> {
        const guild = this.db
            .select({ guild_id: guilds.guild_id })
            .from(guilds)
            .where(eq(guilds.guild_name, course))
            .limit(1)
            .get();

        return guild ?? null;
    }

    async getGuildCourseById(guildId: string): Promise<{ guild_name: string } | null> {
        const guild = this.db
            .select({ guild_name: guilds.guild_name })
            .from(guilds)
            .where(eq(guilds.guild_id, guildId))
            .limit(1)
            .get();

        return guild ?? null;
    }

    // Idempotente: se o servidor já existe (ex.: o bot foi removido e adicionado de novo) mantém a configuração atual
    async addGuild(guildId: string, course: string, clusters: string): Promise<void> {
        this.db
            .insert(guilds)
            .values({ guild_id: guildId, guild_name: course, clusters: clusters })
            .onConflictDoNothing()
            .run();
    }

    async getGuildIdsByCluster(cluster: string): Promise<string[]> {
        const rows = this.db
            .select({ guild_id: guilds.guild_id })
            .from(guilds)
            .where(sql`instr(${guilds.clusters}, ${cluster}) > 0`)
            .all();

        return rows.map((guild) => guild.guild_id);
    }

    async getAllGuilds(): Promise<{ guild_id: string; guild_name: string; clusters: string | null }[]> {
        return this.db
            .select({ guild_id: guilds.guild_id, guild_name: guilds.guild_name, clusters: guilds.clusters })
            .from(guilds)
            .all();
    }
}
