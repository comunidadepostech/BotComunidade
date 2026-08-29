import {
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
import type OnlineMembersCountController from '../../scheduler/onlineMembersCount.controller.ts';
import type TotalMembersCountController from '../../scheduler/totalMembersCount.controller.ts';
import type EventVerificationController from '../../scheduler/eventVerification.controller.ts';
import type EventMessageDeleteController from '../../scheduler/eventMessageDelete.controller.ts';
import type DuplicatedStudentRolesController from '../../scheduler/duplicatedStudentRoles.controller.ts';

export default class ExecCommand implements ICommand, IController {
    constructor(
        private featureFlagsService: IFeatureFlagsService,
        private onlineMemberCount: OnlineMembersCountController,
        private totalMembersCount: TotalMembersCountController,
        private eventVerification: EventVerificationController,
        private eventMessageDelete: EventMessageDeleteController,
        private duplicatedStudentRoles: DuplicatedStudentRolesController
    ) {}

    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('exec')
            .setDescription('Executa um comando do scheduler')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption((option) =>
                option
                    .setName('comando')
                    .setDescription('Qual comando deve ser executado')
                    .setRequired(true)
                    .addChoices(
                        {
                            name: 'Checagem de eventos do servidor',
                            value: 'Checagem de eventos do servidor',
                        },
                        { name: 'Contagem de membros', value: 'Contagem de membros' },
                        { name: 'Contagem de membros online', value: 'Contagem de membros online' },
                        {
                            name: 'Limpeza de mensagens de aviso',
                            value: 'Limpeza de mensagens de aviso',
                        },
                        {
                            name: 'Remoção de cargos de estudantes duplicados',
                            value: 'Remoção de cargos de estudantes duplicados',
                        },
                    ),
            )
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!this.featureFlagsService.isEnabled(interaction.guildId!, 'comando_exec')) {
            await interaction.reply({
                content: 'Comando desabilitado',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const command = interaction.options.getString('comando');

        switch (command) {
            case 'Checagem de eventos do servidor':
                await this.eventVerification.handle()
                break;
            case 'Contagem de membros':
                await this.totalMembersCount.handle()
                break;
            case 'Contagem de membros online':
                await this.onlineMemberCount.handle()
                break;
            case 'Limpeza de mensagens de aviso':
                await this.eventMessageDelete.handle()
                break;
            case 'Remoção de cargos de estudantes duplicados':
                await this.duplicatedStudentRoles.handle()
                break;
        }

        await interaction.reply({
            content: 'Comando executado',
            flags: MessageFlags.Ephemeral,
        });
    }
}
