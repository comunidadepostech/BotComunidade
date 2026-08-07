import type IGuildsRepository from '../../../../types/repositories/guildsRepository.interface';
import { PrismaClient } from '../../../../../prisma/generated/client.ts';

export default class GuildsRepository implements IGuildsRepository {
    constructor(private db: PrismaClient) {}

    async getGuildIdByCourse(course: string): Promise<{ guild_id: string } | null> {
        return await this.db.guilds.findFirst({
            where: {
                guild_name: course,
            },
            select: {
                guild_id: true,
            },
        });
    }

    async getGuildCourseById(guildId: string): Promise<{guild_name: string} | null> {
        return await this.db.guilds.findFirst({
            where: {
                guild_id: guildId,
            },
            select: {
                guild_name: true,
            },
        });
    }

    async addGuild(guildId: string, course: string, clusters: string): Promise<void> {
        await this.db.guilds.create({
            data: {
                guild_id: guildId,
                guild_name: course,
                clusters: clusters
            },
        });
    }

    async getGuildIdsByCluster(cluster: string): Promise<string[]> {
        const guilds = await this.db.guilds.findMany({
            where: {
                clusters: {
                    contains: cluster,
                },
            },
            select: {
                guild_id: true,
            },
        });

        return guilds.map((guild) => guild.guild_id);
    }

    async getAllGuilds(): Promise<{ guild_id: string; guild_name: string; clusters: string | null }[]> {
        return await this.db.guilds.findMany();
    }
}
