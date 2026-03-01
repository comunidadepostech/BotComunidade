import { Client } from "discord.js";
import FeatureFlagsService from "../../services/FeatureFlagsService.ts";

declare global {
    namespace Express {
        interface Request {
            discordClient: Client;
            featureFlagsService: FeatureFlagsService;
        }
    }
}