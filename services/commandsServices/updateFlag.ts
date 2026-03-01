import {UpdateFeatureFlagDTO} from "../../entities/dto/updateFlagDTO.ts";
import FeatureFlagsService from "../FeatureFlagsService.ts";

export default async function updateFlag(dto: UpdateFeatureFlagDTO, featureFlagsService: FeatureFlagsService) {
    await featureFlagsService.updateFlag(dto);
}