export type Flag = string;

export interface IGuildFlags {
    [key: string]: boolean
}

export type GlobalFlags = { [key: string]: IGuildFlags }

export interface IFeatureFlagsRepository {
    getGuildFeatureFlags(guildId: string): Promise<IGuildFlags | null>
    getAllFeatureFlags(): Promise<GlobalFlags>
    updateFeatureFlag(guildId: string, flag: string, value: boolean): Promise<void>
    createFeatureFlag(name: string, defaultValue: boolean): Promise<void>
    checkEmptyFeatureFlags(guildsIds: string[]): Promise<void>
    deleteFeatureFlag(flag: Flag): Promise<void>
    deleteGuildFeatureFlags(guildId: string): Promise<void>
    saveDefaultFeatureFlags(guildId: string): Promise<void>
}