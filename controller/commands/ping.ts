import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import type {ICommand} from "../../types/discord.interfaces.ts";

export class PingCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName("ping")
            .setDescription('Responde com Pong!')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({content: "pong!", flags: MessageFlags.Ephemeral});
    }
}