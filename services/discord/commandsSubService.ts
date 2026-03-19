import {Command, IDiscordCommandsService} from "../../types/discord.interfaces.ts";
import {Client, Guild} from "discord.js";

export default class CommandsSubService implements IDiscordCommandsService {
    constructor(private client: Client) {}

    async clearCommands(guilds: Guild[]) {
        await Promise.all(
            guilds.map(guild => guild.commands.set([]))
        )
    }
    async registerCommand(guilds: Guild[], commands: Command[]) {
        const commandBuilds = commands.map(cmd => cmd.build())

        await Promise.all(
            guilds.map(guild => guild.commands.set(commandBuilds))
        )
    }
}