import type { FeatureFlags } from '../featureFlags.types';

export default interface IFeatureFlagsService {
    /**
     * Sync the local cache with the database (use it in the start of the application)
     */
    syncFlags(): Promise<void>;

    /**
     * Set a flag value for a specific guild
     *
     * @param guildId The id of the guild
     * @param flagName The key of the flag
     * @param value The new value for this flag
     */
    setFlag(guildId: string, flagName: string, value: boolean): Promise<void>;

    /**
     * Delete a flag for all the guilds
     *
     * @param flagName The name of the flag this is going to be deleted
     */
    deleteFlag(flagName: string): Promise<void>;

    /**
     * Get all the flags avaliable
     */
    getAllFlags(): Promise<FeatureFlags>;

    /**
     * Check if the flag in the specified guild is activated
     *
     * @param guildId The id of the guild
     * @param flagName The name of the flag
     */
    isEnabled(guildId: string, flagName: string): boolean;

    /**
     * Get all feature flags for a specific guild.
     *
     * @param guildId The guild ID
     */
    getFlagsByGuildId(guildId: string): Promise<Record<string, boolean>>;

    /**
     * Save the default feature flags for a guild.
     *
     * @param guildId The guild ID
     */
    saveDefaultFeatureFlags(guildId: string): Promise<void>;

    /**
     * Populate the in-memory flags cache from the database.
     */
    fillFlags(): Promise<void>;
}
