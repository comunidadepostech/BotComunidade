import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";
import {
    ChatInputCommandInteraction, MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";

export class RefreshCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName("refresh")
            .setDescription('Recarrega os comandos do bot para caso eles não apareçam em algum servidor')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void> {
        await interaction.deferReply({flags: MessageFlags.Ephemeral})
        await interaction.client.guilds.fetch()
        const guilds = interaction.client.guilds.cache.values().toArray()
        await context.discordService.commands.clearCommands(guilds)
        await context.discordService.commands.registerCommand(guilds, context.commands)
        await interaction.editReply({content: "Comandos recarregados"})
    }
}