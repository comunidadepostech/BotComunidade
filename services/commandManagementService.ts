import {Guild} from "discord.js";
import {Command} from "../entities/discordEntities.ts";

export default class commandManagementService {
    public static async clearCommands(guilds: Array<Guild>) {
        await Promise.all(
            guilds.map(guild => guild.commands.set([]))
        )
    }
    public static async registerCommands(guilds: Array<Guild>, commands: Command[]): Promise<void> {
        const commandBuilds = commands.map(cmd => cmd.build)

        await Promise.all(
            guilds.map(guild => guild.commands.set(commandBuilds))
        )
    }
}
