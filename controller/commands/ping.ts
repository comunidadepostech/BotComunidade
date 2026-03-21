import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import type {ICommand} from "../../types/discord.interfaces.ts";

export class pingCommand implements ICommand {
    build() {
        return new SlashCommandBuilder()
            .setName("ping")
            .setDescription('Responde com Pong!')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({content: "pong!", flags: MessageFlags.Ephemeral});
    }
}