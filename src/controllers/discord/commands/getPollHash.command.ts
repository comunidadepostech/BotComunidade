import type ICommand from '../../../types/interfaces/command.interface.ts';
import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    type MessageContextMenuCommandInteraction,
    InteractionContextType,
    PermissionFlagsBits,
    MessageFlags,
} from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface.ts';
import type IHashingService from '../../../types/services/hashingService.interface.ts';

export default class GetPollHashMenuCommand implements ICommand, IController {
    constructor(private hashingService: IHashingService) {}

    build(): ContextMenuCommandBuilder {
        return new ContextMenuCommandBuilder()
            .setName('Obter hash dessa enquete')
            .setType(ApplicationCommandType.Message)
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: MessageContextMenuCommandInteraction): Promise<void> {
        if (!interaction.targetMessage.poll) {
            await interaction.reply({
                content: '❌ A mensagem selecionada não contém uma enquete.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (interaction.targetMessage.author.id !== interaction.client.user.id) {
            await interaction.reply({
                content: `❌ Essa enquete não foi criada pelo bot.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (!interaction.targetMessage.poll.resultsFinalized) {
            await interaction.reply({
                content: `❌ Essa enquete ainda não foi finalizada.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const hash = this.hashingService.generatePollHash(
            interaction.targetMessage.createdAt.getMonth().toString(),
            interaction.targetMessage.createdAt.getFullYear().toString(),
            interaction.targetMessage.poll!.question.text!
        );

        await interaction.reply({ content: 'Hash da enquete: ' + hash, flags: MessageFlags.Ephemeral });
    }
}
