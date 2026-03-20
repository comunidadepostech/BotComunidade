import {
    ChatInputCommandInteraction, MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";

export class execCommand implements ICommand {
    build() {
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
                        {name: 'Contagem de membros', value: "Contagem de membros"}
                    )
            )
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void | Error> {
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
        }

        await interaction.editReply({content: `**${command}** executado com sucesso`})
    }
}