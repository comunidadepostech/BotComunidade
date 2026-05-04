import type {ICommand, IDiscordCommandsService} from "../../types/discord.interfaces.ts";
import {Guild} from "discord.js";

export default class CommandsSubService implements IDiscordCommandsService {
    constructor() {}

    async clearCommands(guilds: Guild[]): Promise<void> {
        await Promise.all(
            guilds.map(guild => guild.commands.set([]))
        )
    }

    async registerCommand(guilds: Guild[], commands: ICommand[]): Promise<void> {
        const commandBuilds = commands.map(cmd => cmd.build())

        await Promise.all(
            guilds.map(guild => guild.commands.set(commandBuilds))
        )
    }
}