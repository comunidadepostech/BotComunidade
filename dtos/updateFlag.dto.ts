import FeatureFlagsService from "../services/featureFlagsService.ts";

export interface UpdateFeatureFlagDTO {
    guildId: string;
    flagName: string | string[];
    flagValue: boolean;
    featureFlagsService: FeatureFlagsService;
}