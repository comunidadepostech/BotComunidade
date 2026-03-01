import FeatureFlagsService from "../../services/FeatureFlagsService.ts";

export interface UpdateFeatureFlagDTO {
    guildId: string;
    flagName: string | string[];
    flagValue: boolean;
    featureFlagsService: FeatureFlagsService;
}