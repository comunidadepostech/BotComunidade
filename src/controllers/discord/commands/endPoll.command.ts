import type ICommand from '../../../types/interfaces/command.interface.ts';
import {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    MessageContextMenuCommandInteraction,
    InteractionContextType,
    PermissionFlagsBits,
    MessageFlags,
} from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface.ts';
import type ILoggerService from '../../../types/services/loggerService.interface.ts';

export default class EndPollCommand implements ICommand, IController {
    constructor(
        private logger: ILoggerService,
    ) {}

    build(): ContextMenuCommandBuilder {
        return new ContextMenuCommandBuilder()
            .setName('Encerrar enquete')
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

        if (interaction.targetMessage.poll.resultsFinalized) {
            await interaction.reply({ content: `❌ Essa enquete já foi finalizada.`, flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.targetMessage.poll.end();

        await interaction.reply({ content: `✅ Enquete encerrada.`, flags: MessageFlags.Ephemeral });
        this.logger.log(
            `${interaction.user.username} has ended a poll that starts with ${interaction.targetMessage.poll.question.text!.slice(0, 50)}...`,
        );
    }
}
