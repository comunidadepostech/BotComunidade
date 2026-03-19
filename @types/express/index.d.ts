import { Client } from "discord.js";
import FeatureFlagsService from "../../services/featureFlagsService.ts";
import EventsSubService from "../../services/discord/eventsSubService.ts";
import DiscordService from "../../services/discordService.ts";

declare global {
    namespace Express {
        interface Request {
            discordClient: Client;
            featureFlagsService: FeatureFlagsService;
            discordService: DiscordService;
        }
    }
}