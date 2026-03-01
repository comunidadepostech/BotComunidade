import DatabaseConnection from "../repositories/database/databaseConnection.ts";
import {Client} from "discord.js"
import CommandManagementService from "../services/commandManagementService.ts";

export default class ShutdownService {
    public static async shutdown(client: Client) {
        client.removeAllListeners()
        await CommandManagementService.clearCommands(client.guilds.cache.values().toArray())
        await DatabaseConnection.endConnection();
        await client.destroy();
        process.exit(0);
    }
}