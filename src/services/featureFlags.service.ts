import { FlagNotFoundError, GuildNotFoundError } from '../types/errors.types';
import type { FeatureFlags } from '../types/featureFlags.types';
import type IFeatureFlagsRepository from '../types/repositories/featureFlagsRepository.interface';
import type IGuildsRepository from '../types/repositories/guildsRepository.interface';
import type IFeatureFlagsService from '../types/services/featureFlagsService.interface';
import { DEFAULT_FEATURE_FLAGS } from '../utils/constants/flagsConstants';

export default class FeatureFlagsService implements IFeatureFlagsService {
    private flagsCache: FeatureFlags;

    constructor(private featureFlagsRepository: IFeatureFlagsRepository, private guildsRepository: IGuildsRepository) {
        this.flagsCache = {};
    }

    async fillFlags(): Promise<void> {
        const [allGuilds, existingFlags] = await Promise.all([
            this.guildsRepository.getAllGuilds(), // Ajuste o nome do método de acordo com sua interface IGuildsRepository
            this.featureFlagsRepository.getAllFeatureFlagsRaw(),
        ]);

        const existingGuildIds = new Set(existingFlags.map((record) => record.guild_id));

        const missingGuilds = allGuilds.filter((guild) => !existingGuildIds.has(guild.guild_id)); // ou guild.guild_id

        if (missingGuilds.length > 0) {
            const newRecords = missingGuilds.map((guild) => ({
                guildId: guild.guild_id,
                flags: { ...DEFAULT_FEATURE_FLAGS },
            }));

            await this.featureFlagsRepository.updateManyFeatureFlags(newRecords);
        }
    }

    async checkFlags(): Promise<void> {
        const allGuildFlags = await this.featureFlagsRepository.getAllFeatureFlagsRaw();
        if (allGuildFlags.length === 0) return;

        const updatedRecords: { guildId: string; flags: Record<string, boolean> }[] = [];
        const defaultKeys = Object.keys(DEFAULT_FEATURE_FLAGS);
        const defaultEntries = Object.entries(DEFAULT_FEATURE_FLAGS);

        for (const record of allGuildFlags) {
            const currentFlags = { ...record.flags };
            let hasChanges = false;

            for (const [flag, defaultValue] of defaultEntries) {
                if (currentFlags[flag] === undefined) {
                    currentFlags[flag] = defaultValue;
                    hasChanges = true;
                }
            }

            for (const flag of Object.keys(currentFlags)) {
                if (!defaultKeys.includes(flag)) {
                    delete currentFlags[flag];
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                updatedRecords.push({
                    guildId: record.guild_id,
                    flags: currentFlags,
                });
            }
        }

        if (updatedRecords.length > 0) {
            await this.featureFlagsRepository.updateManyFeatureFlags(updatedRecords);
        }
    }

    async syncFlags(): Promise<void> {
        this.flagsCache = await this.featureFlagsRepository.getAllFeatureFlags();
    }

    async setFlag(guildId: string, flagName: string, value: boolean): Promise<void> {
        if (!this.flagsCache[guildId]) throw new GuildNotFoundError(guildId, this.constructor.name);

        if (this.flagsCache[guildId][flagName] === undefined)
            throw new FlagNotFoundError(flagName, this.constructor.name);

        this.flagsCache[guildId][flagName] = value;

        await this.featureFlagsRepository.updateFlagByGuildId(guildId, flagName, value);
    }

    async deleteFlag(flagName: string): Promise<void> {
        const defaultKeys = Object.keys(DEFAULT_FEATURE_FLAGS);
        if (!defaultKeys.includes(flagName)) {
            throw new FlagNotFoundError(flagName, this.constructor.name);
        }

        for (const guildId of Object.keys(this.flagsCache)) {
            if (this.flagsCache[guildId]![flagName] !== undefined) {
                delete this.flagsCache[guildId]![flagName];
            }
        }

        await this.featureFlagsRepository.deleteFeatureFlag(flagName);
    }

    async getAllFlags(): Promise<FeatureFlags> {
        return this.flagsCache;
    }

    isEnabled(guildId: string, flagName: string): boolean {
        if (!this.flagsCache[guildId]) throw new GuildNotFoundError(guildId, this.constructor.name);

        if (this.flagsCache[guildId][flagName] === undefined)
            throw new FlagNotFoundError(flagName, this.constructor.name);

        return this.flagsCache[guildId][flagName];
    }

    async getFlagsByGuildId(guildId: string): Promise<Record<string, boolean>> {
        if (!this.flagsCache[guildId]) throw new GuildNotFoundError(guildId, this.constructor.name);

        return this.flagsCache[guildId];
    }

    async saveDefaultFeatureFlags(guildId: string): Promise<void> {
        this.flagsCache[guildId] = { ...DEFAULT_FEATURE_FLAGS };

        await this.featureFlagsRepository.saveDefaultFeatureFlags(guildId);
    }
}
