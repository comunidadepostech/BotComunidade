import {Command, CommandContext} from "../../../entities/discordEntities.ts";
import {ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from "discord.js";

export const viewFlagsCommand: Command = {
    name: "viewflags",
    build: new SlashCommandBuilder()
        .setName("viewflags")
        .setDescription('Retorna as feature flags do Bot e seus estados no servidor atual')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    execute: async (interaction: ChatInputCommandInteraction, context: CommandContext) => {
        await interaction.reply({flags: MessageFlags.Ephemeral, content: "```json\n" + JSON.stringify(context.featureFlagsService.flags[interaction.guildId!], null, 2) + "```"})
    }
}