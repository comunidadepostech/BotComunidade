import {
    ApplicationCommandType,
    InteractionContextType,
    PermissionFlagsBits,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} from 'discord.js';
import type ICommand from '../../../types/interfaces/command.interface';
import type IController from '../../../types/interfaces/controller.interface';
import type IMessageService from '../../../types/services/messageService.interface';
import type { LinkButtonAction } from '../../../types/component.types';
import { IncompatibleChannelError } from '../../../types/errors.types';
import type ILoggerService from '../../../types/services/loggerService.interface';

export default class ReplyCommand implements IController, ICommand {
    constructor(
        private readonly messageService: IMessageService,
        private logger: ILoggerService,
    ) {}

    build(): ContextMenuCommandBuilder {
        return new ContextMenuCommandBuilder()
            .setName('Responder a essa mensagem')
            .setType(ApplicationCommandType.Message)
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: MessageContextMenuCommandInteraction): Promise<void> {
        const customId = `reply_modal_${interaction.id}`;
        const modal = new ModalBuilder().setCustomId(customId).setTitle('Responder Mensagem');

        const messageInput = new TextInputBuilder()
            .setCustomId('content')
            .setLabel('Conteúdo da Mensagem')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setPlaceholder('Digite a mensagem que deseja enviar...');

        const link1Input = new TextInputBuilder()
            .setCustomId('link_1')
            .setLabel('Link 1 (Opcional - Formato: Rótulo | URL)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('Ex: Google | https://google.com');

        const link2Input = new TextInputBuilder()
            .setCustomId('link_2')
            .setLabel('Link 2 (Opcional - Formato: Rótulo | URL)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('Ex: Suporte | https://suporte.com');

        const link3Input = new TextInputBuilder()
            .setCustomId('link_3')
            .setLabel('Link 3 (Opcional - Formato: Rótulo | URL)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setPlaceholder('Ex: Site | https://site.com');

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(link1Input),
            new ActionRowBuilder<TextInputBuilder>().addComponents(link2Input),
            new ActionRowBuilder<TextInputBuilder>().addComponents(link3Input),
        );

        await interaction.showModal(modal);

        const modalInteraction = await interaction
            .awaitModalSubmit({
                filter: (inter) => inter.customId === customId && inter.user.id === interaction.user.id,
                time: 300000,
            })
            .catch(() => null);

        if (!modalInteraction) return;

        const content = modalInteraction.fields.getTextInputValue('content');
        const linkInputs = [
            modalInteraction.fields.getTextInputValue('link_1'),
            modalInteraction.fields.getTextInputValue('link_2'),
            modalInteraction.fields.getTextInputValue('link_3'),
        ];

        const actions: LinkButtonAction[] = [];

        for (const input of linkInputs) {
            if (!input.trim()) continue;

            const [label, url] = input.split('|').map((str) => str.trim());

            if (label && url && (url.startsWith('http://') || url.startsWith('https://'))) {
                actions.push({
                    type: 'link',
                    label: label,
                    url: url,
                });
            }
        }

        const previewComponents: ActionRowBuilder<ButtonBuilder>[] = [];

        if (actions.length > 0) {
            const linkButtonsRow = new ActionRowBuilder<ButtonBuilder>();
            actions.forEach((action) => {
                linkButtonsRow.addComponents(
                    new ButtonBuilder().setLabel(action.label).setStyle(ButtonStyle.Link).setURL(action.url),
                );
            });
            previewComponents.push(linkButtonsRow);
        }

        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_send')
                .setLabel('Confirmar e Enviar')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_send').setLabel('Cancelar').setStyle(ButtonStyle.Danger),
        );
        previewComponents.push(confirmRow);

        const previewResponse = await modalInteraction.reply({
            content: `**Preview da mensagem:**\n\n${content}`,
            components: previewComponents,
            ephemeral: true,
            fetchReply: true,
        });

        const buttonCollector = previewResponse.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000,
        });

        buttonCollector.on('collect', async (btnInteraction) => {
            if (btnInteraction.user.id !== interaction.user.id) {
                await btnInteraction.reply({ content: 'Você não pode interagir com este menu.', ephemeral: true });
                return;
            }

            if (btnInteraction.customId === 'confirm_send') {
                try {
                    const channel = await interaction.client.channels.fetch(interaction.channelId);

                    if (!channel) return;

                    if (!channel.isSendable() || channel.isDMBased())
                        throw new IncompatibleChannelError(channel!.id, 'some sendable channel', this.handle.name);

                    await this.messageService.sendMessage(
                        {
                            id: channel.id,
                            guild: { id: interaction.guild!.id, name: interaction.guild!.name },
                            name: channel.name,
                        },
                        content,
                        { actions, replyTo: interaction.targetMessage.id },
                    );

                    await btnInteraction.update({ content: '✅ Mensagem enviada com sucesso!', components: [] });
                } catch (error) {
                    await btnInteraction.update({ content: '❌ Houve um erro ao enviar a mensagem.', components: [] });

                    throw error;
                }
            } else if (btnInteraction.customId === 'cancel_send') {
                await btnInteraction.update({ content: '🚫 Envio cancelado.', components: [] });
            }

            buttonCollector.stop();
        });

        buttonCollector.on('end', async (_, reason) => {
            if (reason === 'time') {
                await modalInteraction
                    .editReply({ content: '⏰ Tempo de confirmação esgotado.', components: [] })
                    .catch(() => null);

                this.logger.warn('Canceled message reply or timeout.');
            }
        });
    }
}
