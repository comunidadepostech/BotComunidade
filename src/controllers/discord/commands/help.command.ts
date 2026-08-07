import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    InteractionContextType,
    type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import type ICommand from '../../../types/interfaces/command.interface.ts';
import type IController from '../../../types/interfaces/controller.interface.ts';

export default class HelpCommand implements ICommand, IController {
    constructor() {}
    
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('help')
            .setDescription('Exibe uma mensagem de ajuda')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setColor(0x9b652a)
            .setDescription(
                'Se estiver tendo problemas com o bot ou precisa de mais informações sobre seu funcionamento, use os botões abaixo para se orientar.',
            );

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Comandos disponíveis')
                .setURL('https://github.com/comunidadepostech/BotComunidade')
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel('Reporte um problema')
                .setURL('https://github.com/comunidadepostech/BotComunidade/issues/new')
                .setStyle(ButtonStyle.Link),
        );

        await interaction.reply({
            embeds: [embed],
            components: [buttons],
            flags: MessageFlags.Ephemeral,
        });
    }
}
