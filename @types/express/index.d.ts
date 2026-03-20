import { Client } from "discord.js";
import FeatureFlagsService from "../../services/featureFlagsService.ts";
import DiscordService from "../../services/discordService.ts";
import {WebhookController} from "../../controller/webhookController.ts";

declare global {
    namespace Express {
        interface Request {
            discordClient: Client;
            featureFlagsService: FeatureFlagsService;
            discordService: DiscordService;
            webhookController: WebhookController;
        }
    }
}