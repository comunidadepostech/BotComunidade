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

    async registerMissingGuilds(guildIds: string[]): Promise<string[]> {
        const storedGuilds = await this.guildsRepository.getAllGuilds();
        const storedGuildIds = new Set(storedGuilds.map((guild) => guild.guild_id));

        const missingGuildIds = guildIds.filter((guildId) => !storedGuildIds.has(guildId));

        // Mesmo padrão do saveNewGuild: sigla e clusters vazios até serem configurados. As feature flags padrão
        // são criadas logo depois pelo FeatureFlagsService.fillFlags()
        for (const guildId of missingGuildIds) {
            await this.guildsRepository.addGuild(guildId, '', '');
        }

        if (missingGuildIds.length > 0) await this.syncGuilds();

        return missingGuildIds;
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
