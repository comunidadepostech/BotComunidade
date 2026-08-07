import type { FeatureFlags, GuildFlags } from '../featureFlags.types';

export default interface IFeatureFlagsRepository {
    /**
     * Get feature flags for a specific guild.
     *
     * @param guildId The guild ID
     */
    getGuildFeatureFlags(guildId: string): Promise<{ [key: string]: boolean }>;

    /**
     * Get all feature flags across all guilds.
     */
    getAllFeatureFlags(): Promise<FeatureFlags>;

    /**
     * Create a new feature flag with a default value.
     *
     * @param name The flag name
     * @param defaultValue The default boolean value
     */
    createFeatureFlag(name: string, defaultValue: boolean): Promise<void>;

    /**
     * Delete a feature flag.
     *
     * @param flag The name of the flag to delete
     */
    deleteFeatureFlag(flag: string): Promise<void>;

    /**
     * Save the default feature flags for a guild.
     *
     * @param guildId The guild ID
     */
    saveDefaultFeatureFlags(guildId: string): Promise<void>;

    /**
     * Update a specific feature flag for a guild.
     *
     * @param guildId The guild ID
     * @param flagName The flag name
     * @param value The new boolean value
     */
    updateFlagByGuildId(guildId: string, flagName: string, value: boolean): Promise<void>;

    /**
     * Retrieve raw feature flag records for all guilds.
     */
    getAllFeatureFlagsRaw(): Promise<{ guild_id: string; flags: GuildFlags }[]>;

    /**
     * Update multiple guild feature flag records in bulk.
     *
     * @param records Array of guild IDs and associated flags
     */
    updateManyFeatureFlags(records: { guildId: string; flags: Record<string, boolean> }[]): Promise<void>;
}
