
export interface UpdateFeatureFlagDTO {
    guildId: string;
    flagName: string | string[];
    flagValue: boolean;
}