import {
    ChatInputCommandInteraction, MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";

export class ExecCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName("exec")
            .setDescription('Executa um comando do scheduler')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(option =>
                option.setName('comando')
                    .setDescription('Qual comando deve ser executado')
                    .setRequired(true)
                    .addChoices(
                        {name: 'Checagem de eventos do servidor', value: "Checagem de eventos do servidor"},
                        {name: 'Contagem de membros', value: "Contagem de membros"},
                        {name: 'Contagem de membros online', value: "Contagem de membros online"},
                        {name: 'Limpeza de mensagens de aviso', value: "Limpeza de mensagens de aviso"},
                    )
            )
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void> {
        if (!context.featureFlagsService.getFlag(interaction.guildId!, "comando_exec")) {
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
            case "Contagem de membros online":
                await context.schedulerService.handleOnlineMembersCount()
                break
            case "Limpeza de mensagens de aviso":
                await context.schedulerService.handleEventWarningMessagesDelete()
                break
            default:
                await interaction.editReply({content: "Comando desconhecido"})
                return;
        }

        await interaction.editReply({content: `**${command}** executado com sucesso`})
    }
}