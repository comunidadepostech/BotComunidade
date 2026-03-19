export type Flag = string;

export interface GuildFlags {
    [key: string]: boolean
}

export type globalFlags = { [key: string]: GuildFlags }

export interface FeatureFlagsRepository {
    getGuildFeatureFlags(guildId: string): Promise<GuildFlags | null>
    getAllFeatureFlags(): Promise<globalFlags | {}>
    updateFeatureFlag(guildId: string, flag: string, value: boolean): Promise<Error | undefined>
    createFeatureFlag(name: string, defaultValue: boolean): Promise<void>
    checkEmptyFeatureFlags(guildsIds: string[]): Promise<void>
    deleteFeatureFlag(flag: Flag): Promise<void>
    deleteGuildFeatureFlags(guildId: string): Promise<void>
    saveDefaultFeatureFlags(guildId: string): Promise<void>
}