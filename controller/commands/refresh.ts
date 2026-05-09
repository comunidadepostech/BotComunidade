import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";
import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    InteractionContextType,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";

export class RefreshCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName("refresh")
            .setDescription('Recarrega os comandos do bot para caso eles não apareçam em algum servidor')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts(InteractionContextType.Guild);
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void> {
        await interaction.client.guilds.fetch()
        await interaction.reply({content: "Os comandos estão sendo recarregados, isso não deve demorar."})
        await context.discordService.commands.clearCommands(context.client)
        await context.discordService.commands.registerCommands(context.client, context.commands)
    }
}