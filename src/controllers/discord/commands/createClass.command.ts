import {
    ChannelType,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    InteractionContextType,
    type SlashCommandOptionsOnlyBuilder,
    MessageFlags,
} from 'discord.js';
import type ICommand from '../../../types/interfaces/command.interface.ts';
import type IController from '../../../types/interfaces/controller.interface.ts';
import type IFeatureFlagsService from '../../../types/services/featureFlagsService.interface.ts';
import type IClassService from '../../../types/services/classService.interface.ts';

export default class CreateclassCommand implements ICommand, IController {
    constructor(
        private featureFlagsService: IFeatureFlagsService,
        private classService: IClassService,
    ) {}

    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('createclass')
            .setDescription('Cria uma nova turma')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption((option) => option.setName('name').setDescription('Nome da turma').setRequired(true))
            .addChannelOption((option) =>
                option
                    .setName('faq-channel')
                    .setDescription('Canal de faq da nova turma (obrigatório para novas turmas)')
                    .setRequired(true)
                    .addChannelTypes([ChannelType.GuildText]),
            )
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!this.featureFlagsService.isEnabled(interaction.guildId!, 'comando_createclass')) {
            await interaction.reply({
                content: 'Comando desabilitado',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const className = interaction.options.getString('name', true);
        const faqChannelId = interaction.options.getChannel('faq-channel', true).id;

        const inviteUrl = await this.classService.createClass(interaction.guildId!, className, faqChannelId);

        await interaction.editReply({ content: `Comando executado\nTurma: ${className}\nInvite para os alunos: ${inviteUrl}` });
    }
}
