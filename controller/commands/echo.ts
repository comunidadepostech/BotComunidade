import {
    ActionRowBuilder,
    Attachment,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    ChatInputCommandInteraction,
    ModalBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
    type SlashCommandOptionsOnlyBuilder,
    type InteractionResponse,
} from 'discord.js';
import type { ICommand, ICommandContext } from '../../types/discord.interfaces.ts';
import type { BroadcastMessageDto } from '../../dtos/broadcastMessage.dto.ts';

export class EchoCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('echo')
            .setDescription(
                'Cria uma mensagem com quebras de linha reais e escolhe o destino após redigir.',
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addAttachmentOption((option) =>
                option
                    .setName('attachment')
                    .setDescription('Primeiro anexo (opcional)')
                    .setRequired(false),
            )
            .addAttachmentOption((option) =>
                option
                    .setName('attachment-2')
                    .setDescription('Segundo anexo (opcional)')
                    .setRequired(false),
            );
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        context: ICommandContext,
    ): Promise<void> {
        // Captura os anexos da interação inicial
        const attachment1 = interaction.options.getAttachment('attachment');
        const attachment2 = interaction.options.getAttachment('attachment-2');
        const files = [attachment1, attachment2].filter((att): att is Attachment => att !== null);

        // Constrói e exibe o Modal
        const modalId = `echo_modal_${interaction.id}`;
        const textInputId = `echo_text_${interaction.id}`;

        const modal = new ModalBuilder().setCustomId(modalId).setTitle('Redigir Mensagem');

        const textInput = new TextInputBuilder()
            .setCustomId(textInputId)
            .setLabel("Conteúdo (Use 'Enter' para quebrar linha)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMinLength(1);

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(textInput));

        await interaction.showModal(modal);

        // Aguarda o envio do Modal
        let modalSubmit;
        try {
            modalSubmit = await interaction.awaitModalSubmit({
                filter: (interaction) => interaction.customId === modalId,
                time: 300_000, // 5 minutos de limite para digitar
            });
        } catch {
            return;
        }

        // Variáveis de estado da nossa "interface"
        let content = modalSubmit.fields.getTextInputValue(textInputId);
        let selectedChannel: TextChannel | null = null;
        let onlyTargetChannel = false;

        // Função para renderizar a interface de Preview e Opções
        const renderUI = (): {
            content: string;
            components: ActionRowBuilder<
                ChannelSelectMenuBuilder | StringSelectMenuBuilder | ButtonBuilder
            >[];
            ephemeral: boolean;
        } => {
            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('select_channel')
                .setPlaceholder(
                    selectedChannel
                        ? `Canal: #${selectedChannel.name}`
                        : 'Selecione o canal de destino',
                )
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

            const scopeSelect = new StringSelectMenuBuilder()
                .setCustomId('select_scope')
                .setPlaceholder(
                    onlyTargetChannel
                        ? 'Modo: Apenas no canal selecionado'
                        : 'Modo: Todos com o mesmo nome',
                )
                .addOptions([
                    { label: 'Enviar para todos os canais com o mesmo nome', value: 'all' },
                    { label: 'Enviar APENAS no canal selecionado', value: 'single' },
                ]);

            const btnEdit = new ButtonBuilder()
                .setCustomId('btn_edit')
                .setLabel('Editar Texto')
                .setStyle(ButtonStyle.Secondary);

            const btnSend = new ButtonBuilder()
                .setCustomId('btn_send')
                .setLabel('Confirmar e Enviar')
                .setStyle(ButtonStyle.Success)
                .setDisabled(selectedChannel === null); // Só ativa se um canal for escolhido

            return {
                content: `**Preview da Mensagem**\n\n${content}`,
                components: [
                    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect),
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(scopeSelect),
                    new ActionRowBuilder<ButtonBuilder>().addComponents(btnEdit, btnSend),
                ],
                ephemeral: true,
            };
        };

        // Envia o Preview interativo
        const response: InteractionResponse = await modalSubmit.reply({
            ...renderUI(),
            fetchReply: true, // Necessário para criar o collector
        });

        // Collector para gerenciar os Select Menus e Botões
        const collector = response.createMessageComponentCollector({
            time: 300_000, // 5 minutos de limite na tela de opções
        });

        // eslint-disable-next-line sonarjs/cognitive-complexity
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'select_channel' && interaction.isChannelSelectMenu()) {
                selectedChannel = interaction.channels.first() as TextChannel;
                await interaction.update(renderUI());
            } else if (
                interaction.customId === 'select_scope' &&
                interaction.isStringSelectMenu()
            ) {
                onlyTargetChannel = interaction.values[0] === 'single';
                await interaction.update(renderUI());
            } else if (interaction.customId === 'btn_edit' && interaction.isButton()) {
                const editModalId = `echo_edit_modal_${interaction.id}`;
                const editModal = new ModalBuilder()
                    .setCustomId(editModalId)
                    .setTitle('Editar Mensagem');

                const editTextInput = new TextInputBuilder()
                    .setCustomId(textInputId)
                    .setLabel('Conteúdo')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setValue(content);

                editModal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(editTextInput),
                );
                await interaction.showModal(editModal);

                try {
                    const editSubmit = await interaction.awaitModalSubmit({
                        filter: (modal) => modal.customId === editModalId,
                        time: 300_000,
                    });
                    content = editSubmit.fields.getTextInputValue(textInputId);
                    await editSubmit.update(renderUI());
                } catch (error) {
                    console.warn('Edição cancelada ou tempo esgotado ', error);
                }
            } else if (interaction.customId === 'btn_send' && interaction.isButton()) {
                if (!selectedChannel) return; // Fallback de segurança

                await interaction.update({ content: 'Enviando mensagem...', components: [] });
                collector.stop('sent');

                const dto: BroadcastMessageDto = {
                    content,
                    files,
                    targetChannel: selectedChannel,
                    onlyTargetChannel,
                };

                try {
                    await context.discordService.messages.broadcast(dto);
                    await interaction.editReply({
                        content: `✅ Mensagem enviada com sucesso para ${selectedChannel}!`,
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Erro desconhecido';
                    await interaction.editReply({
                        content: `❌ Erro ao enviar a mensagem: ${message}`,
                    });
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'sent') {
                interaction.editReply({ components: [] }).catch(() => {});
            }
        });
    }
}
