import { InvalidCourseNameError } from '../types/errors.types';
import type IFeatureFlagsRepository from '../types/repositories/featureFlagsRepository.interface';
import type IGuildsRepository from '../types/repositories/guildsRepository.interface';
import type IGuildService from '../types/services/guildService.interface';

export default class GuildService implements IGuildService {
    private guildsCache: { guild_id: string; guild_name: string; clusters: string | null }[];

    constructor(
        private guildsRepository: IGuildsRepository,
        private flagsRepository: IFeatureFlagsRepository,
    ) {
        this.guildsCache = [];
    }

    async getClustersByGuildId(guildId: string): Promise<string | null | undefined> {
        return this.guildsCache.find((guild) => guild.guild_id === guildId)?.clusters;
    }

    async syncGuilds(): Promise<void> {
        this.guildsCache = await this.guildsRepository.getAllGuilds();
    }

    async saveNewGuild(guildId: string): Promise<void> {
        await this.guildsRepository.addGuild(guildId, '', '');

        await this.flagsRepository.saveDefaultFeatureFlags(guildId);

        await this.syncGuilds();
    }

    async getGuildIdByCourseName(courseName: string): Promise<string> {
        const guild = await this.guildsRepository.getGuildIdByCourse(courseName);

        if (!guild?.guild_id) throw new InvalidCourseNameError(courseName, this.getGuildIdByCourseName.name);

        return guild.guild_id;
    }

    async getGuildIdsByClusters(cluster: string[]): Promise<string[]> {
        return this.guildsCache
            .filter((guild) => guild.clusters?.split(', ').some((clust) => cluster.includes(clust)))
            .map((guild) => guild.guild_id);
    }
}
