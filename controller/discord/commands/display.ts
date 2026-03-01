import {
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import {Command} from "../../../entities/discordEntities.ts";

export const displayCommand: Command = {
    name: 'display',
    build: new SlashCommandBuilder()
        .setName("display")
        .setDescription("Exibe os convites ativos do servidor")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (_interaction: ChatInputCommandInteraction) => {

    }
}