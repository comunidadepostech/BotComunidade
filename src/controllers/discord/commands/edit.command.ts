import type ICommand from '../../../types/interfaces/command.interface.ts';
import {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    MessageContextMenuCommandInteraction,
    InteractionContextType,
    PermissionFlagsBits,
    MessageFlags,
    type ModalActionRowComponentBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface.ts';
import type ILoggerService from '../../../types/services/loggerService.interface.ts';

export default class EditCommand implements ICommand, IController {
    constructor(
        private logger: ILoggerService
    ) {}

    build(): ContextMenuCommandBuilder {
        return new ContextMenuCommandBuilder()
            .setName('Editar mensagem')
            .setType(ApplicationCommandType.Message)
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: MessageContextMenuCommandInteraction): Promise<void> {
        const targetMessage = interaction.targetMessage;

        if (targetMessage.author.id !== interaction.client.user.id) {
            await interaction.reply({
                content: '❌ Essa mensagem não pertence ao bot.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (!targetMessage.content) {
            await interaction.reply({
                content: '❌ Esta mensagem não possui texto simples para ser editado.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const modal = new ModalBuilder().setCustomId(`edit_modal_${targetMessage.id}`).setTitle('Editar Mensagem');

        const textInput = new TextInputBuilder()
            .setCustomId('edited_content')
            .setLabel('Edite o texto abaixo:')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(targetMessage.content)
            .setMaxLength(2000)
            .setRequired(true);

        const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(textInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);

        try {
            const modalSubmit = await interaction.awaitModalSubmit({
                filter: (modalInteraction) =>
                    modalInteraction.customId === `edit_modal_${targetMessage.id}` &&
                    modalInteraction.user.id === interaction.user.id,
                time: 300_000,
            });

            const newContent = modalSubmit.fields.getTextInputValue('edited_content');

            if (!targetMessage.channel.isTextBased) return;
            
            await targetMessage.edit({ content: newContent });

            await modalSubmit.reply({ content: `✅ Mensagem editada com sucesso.`, flags: MessageFlags.Ephemeral });
        } catch {
            this.logger.warn('Canceled message edit or timeout.');
        }
    }
}
