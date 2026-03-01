import {
    ChatInputCommandInteraction, MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import {Command, CommandContext} from "../../../entities/discordEntities.ts";

export const execCommand: Command = {
    name: 'exec',
    flag: "comando_exec",
    build: new SlashCommandBuilder()
        .setName("exec")
        .setDescription('Executa um comando do scheduler')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('comando')
                .setDescription('Qual comando deve ser executado')
                .setRequired(true)
                .addChoices(
                    {name: 'Checagem de eventos do servidor', value: "1"},
                    {name: 'Contagem de membros', value: "2"}
                )
        ),
    execute: async (interaction: ChatInputCommandInteraction, context: CommandContext) => {
        if (!context.featureFlagsService.flags[interaction.guildId!]!["comando_exec"]) {
            await interaction.reply({content: "❌ Comando desabilitado", flags: MessageFlags.Ephemeral})
            return;
        }
    }
}