import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import {Command} from "../../../entities/discordEntities.ts";

export const pingCommand: Command = {
    name: 'ping',
    build: new SlashCommandBuilder()
        .setName(import.meta.url.split('/').pop()!.replace('.ts', ''))
        .setDescription('Responde com Pong!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply({content: "pong!", flags: MessageFlags.Ephemeral});
    }
}