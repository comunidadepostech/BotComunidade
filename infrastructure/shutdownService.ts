import DatabaseConnection from "../repositories/database/databaseConnection.ts";
import {Client} from "discord.js"
import {IDiscordCommandsService} from "../types/discord.interfaces.ts";

export default class ShutdownService {
    public static async shutdown(client: Client, commandService: IDiscordCommandsService) {
        client.removeAllListeners()
        await commandService.clearCommands(client.guilds.cache.values().toArray())
        await DatabaseConnection.endConnection();
        await client.destroy();
        process.exit(0);
    }
}