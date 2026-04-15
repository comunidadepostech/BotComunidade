import DatabaseConnection from "../repositories/database/databaseConnection.ts";
import {Client} from "discord.js"
import type {IDiscordCommandsService} from "../types/discord.interfaces.ts";

export default class ShutdownService {
    public static async shutdown(client: Client, commandService: IDiscordCommandsService, databaseConnection: DatabaseConnection): Promise<void> {
        client.removeAllListeners()
        await commandService.clearCommands(client.guilds.cache.values().toArray())
        await databaseConnection.endConnection();
        await client.destroy();
        process.exit(0);
    }
}