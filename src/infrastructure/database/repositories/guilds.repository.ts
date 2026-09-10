import { eq, like } from 'drizzle-orm';
import type IGuildsRepository from '../../../types/repositories/guildsRepository.interface';
import type { Database } from '../../../db/index.ts';
import { guilds } from '../../../db/schema.ts';

export default class GuildsRepository implements IGuildsRepository {
    constructor(private db: Database) {}

    async getGuildIdByCourse(course: string): Promise<{ guild_id: string } | null> {
        const [guild] = await this.db
            .select({ guild_id: guilds.guild_id })
            .from(guilds)
            .where(eq(guilds.guild_name, course))
            .limit(1);

        return guild ?? null;
    }

    async getGuildCourseById(guildId: string): Promise<{ guild_name: string } | null> {
        const [guild] = await this.db
            .select({ guild_name: guilds.guild_name })
            .from(guilds)
            .where(eq(guilds.guild_id, guildId))
            .limit(1);

        return guild ?? null;
    }

    async addGuild(guildId: string, course: string, clusters: string): Promise<void> {
        await this.db.insert(guilds).values({ guild_id: guildId, guild_name: course, clusters: clusters });
    }

    async getGuildIdsByCluster(cluster: string): Promise<string[]> {
        const rows = await this.db
            .select({ guild_id: guilds.guild_id })
            .from(guilds)
            .where(like(guilds.clusters, `%${cluster}%`));

        return rows.map((guild) => guild.guild_id);
    }

    async getAllGuilds(): Promise<{ guild_id: string; guild_name: string; clusters: string | null }[]> {
        return await this.db
            .select({ guild_id: guilds.guild_id, guild_name: guilds.guild_name, clusters: guilds.clusters })
            .from(guilds);
    }
}
