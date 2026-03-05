import {
    ChatInputCommandInteraction, MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import {Command, CommandContext} from "../../../entities/discordEntities.ts";
import {SchedulerService} from "../../../services/schedulerService.ts";

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
                    {name: 'Checagem de eventos do servidor', value: "Checagem de eventos do servidor"},
                    {name: 'Contagem de membros', value: "Contagem de membros"}
                )
        ),
    execute: async (interaction: ChatInputCommandInteraction, context: CommandContext) => {
        if (!context.featureFlagsService.flags[interaction.guildId!]!["comando_exec"]) {
            await interaction.reply({content: "❌ Comando desabilitado", flags: MessageFlags.Ephemeral})
            return;
        }

        const command = interaction.options.getString('comando', true)!;

        await interaction.deferReply({flags: MessageFlags.Ephemeral})

        switch (command) {
            case "Checagem de eventos do servidor":
                await context.schedulerService.handleEventVerification()
                break
            case "Contagem de membros":
                await context.schedulerService.handleMembersCount()
                break
        }

        await interaction.editReply({content: `${command} executado com sucesso`, flags: MessageFlags.Ephemeral})
    }
}