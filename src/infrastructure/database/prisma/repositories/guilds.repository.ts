import type IGuildsRepository from '../../../../types/repositories/guildsRepository.interface';
import type { Database } from '../../../../prisma/db.ts';

export default class GuildsRepository implements IGuildsRepository {
    constructor(private db: Database) {}

    async getGuildIdByCourse(course: string): Promise<{ guild_id: string } | null> {
        return await this.db.orm.public.Guilds.select('guild_id').first({ guild_name: course });
    }

    async getGuildCourseById(guildId: string): Promise<{ guild_name: string } | null> {
        return await this.db.orm.public.Guilds.select('guild_name').first({ guild_id: guildId });
    }

    async addGuild(guildId: string, course: string, clusters: string): Promise<void> {
        await this.db.orm.public.Guilds.create({
            guild_id: guildId,
            guild_name: course,
            clusters: clusters,
        });
    }

    async getGuildIdsByCluster(cluster: string): Promise<string[]> {
        const guilds = await this.db.orm.public.Guilds.select('guild_id')
            .where((guild) => guild.clusters.like(`%${cluster}%`))
            .all();

        return guilds.map((guild) => guild.guild_id);
    }

    async getAllGuilds(): Promise<{ guild_id: string; guild_name: string; clusters: string | null }[]> {
        return await this.db.orm.public.Guilds.select('guild_id', 'guild_name', 'clusters').all();
    }
}
