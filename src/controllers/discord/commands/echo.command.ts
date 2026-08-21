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
    InteractionContextType,
    type SlashCommandOptionsOnlyBuilder,
    MessageFlags,
    LabelBuilder,
    FileUploadBuilder,
} from 'discord.js';
import type ICommand from '../../../types/interfaces/command.interface';
import type IController from '../../../types/interfaces/controller.interface';
import type BroadcastMessageDTO from '../../../types/dtos/broadcastMessage.dtos';
import type IMessageService from '../../../types/services/messageService.interface';
import type ILoggerService from '../../../types/services/loggerService.interface';

const AVAILABLE_CLUSTERS = ['Dev', 'IA', 'Cyber', 'Tech Business', 'Data'];
const MAX_ATTACHMENTS = 2;

export default class EchoCommand implements ICommand, IController {
    constructor(
        private messageService: IMessageService,
        private logger: ILoggerService,
    ) {}

    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('echo')
            .setDescription('Cria uma mensagem com quebras de linha reais e escolhe o destino após redigir.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        const modalId = `echo_modal_${interaction.id}`;
        const textInputId = `echo_text_${interaction.id}`;
        const fileUploadId = `echo_files_${interaction.id}`;

        const textInput = new TextInputBuilder()
            .setCustomId(textInputId)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMinLength(1);

        const contentLabel = new LabelBuilder()
            .setLabel("Conteúdo (Use 'Enter' para quebrar linha)")
            .setTextInputComponent(textInput);

        const fileUpload = new FileUploadBuilder()
            .setCustomId(fileUploadId)
            .setMinValues(0)
            .setMaxValues(MAX_ATTACHMENTS)
            .setRequired(false);

        const fileUploadLabel = new LabelBuilder()
            .setLabel(`Anexos (opcional, até ${MAX_ATTACHMENTS})`)
            .setFileUploadComponent(fileUpload);

        const modal = new ModalBuilder()
            .setCustomId(modalId)
            .setTitle('Redigir Mensagem')
            .addLabelComponents(contentLabel, fileUploadLabel);

        await interaction.showModal(modal);

        let modalSubmit;
        try {
            modalSubmit = await interaction.awaitModalSubmit({
                filter: (sub) => sub.customId === modalId,
                time: 300_000, // 5 minutes to type
            });
        } catch {
            return;
        }

        // Interface State
        let content = modalSubmit.fields.getTextInputValue(textInputId);

        const uploadedFiles = modalSubmit.fields.getUploadedFiles(fileUploadId);
        const files: Attachment[] = uploadedFiles ? [...uploadedFiles.values()] : [];

        let selectedChannel: TextChannel | null = null;
        let onlyTargetChannel = false;
        let selectedClusters: string[] = [];

        const clusterOptions = AVAILABLE_CLUSTERS.slice(0, 25).map((cluster) => ({
            label: cluster,
            value: cluster,
        }));

        const renderUI = (): {
            content: string;
            components: ActionRowBuilder<ChannelSelectMenuBuilder | StringSelectMenuBuilder | ButtonBuilder>[];
        } => {
            const channelSelect = new ChannelSelectMenuBuilder()
                .setCustomId('select_channel')
                .setPlaceholder(selectedChannel ? `Canal: #${selectedChannel.name}` : 'Selecione o canal de destino')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

            const scopeSelect = new StringSelectMenuBuilder()
                .setCustomId('select_scope')
                .setPlaceholder(
                    onlyTargetChannel ? 'Modo: Apenas no canal selecionado' : 'Modo: Todos com o mesmo nome',
                )
                .addOptions([
                    { label: 'Enviar para todos os canais com o mesmo nome', value: 'all' },
                    { label: 'Enviar APENAS no canal selecionado', value: 'single' },
                ]);

            const clusterSelect = new StringSelectMenuBuilder()
                .setCustomId('select_clusters')
                .setPlaceholder(
                    selectedClusters.length
                        ? `Clusters: ${selectedClusters.length} selecionado(s)`
                        : 'Filtrar por cluster (opcional)',
                )
                .setMinValues(0)
                .setMaxValues(Math.max(clusterOptions.length, 1))
                .addOptions(
                    clusterOptions.length ? clusterOptions : [{ label: 'Nenhum cluster disponível', value: 'none' }],
                )
                .setDisabled(onlyTargetChannel || clusterOptions.length === 0);

            const btnEdit = new ButtonBuilder()
                .setCustomId('btn_edit')
                .setLabel('Editar Texto')
                .setStyle(ButtonStyle.Secondary);

            const btnSend = new ButtonBuilder()
                .setCustomId('btn_send')
                .setLabel('Confirmar e Enviar')
                .setStyle(ButtonStyle.Success)
                .setDisabled(selectedChannel === null);

            return {
                content: `**Preview da Mensagem**\n\n${content}${
                    files.length ? `\n\n📎 ${files.length} anexo(s) prontos para envio` : ''
                }`,
                components: [
                    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect),
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(scopeSelect),
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(clusterSelect),
                    new ActionRowBuilder<ButtonBuilder>().addComponents(btnEdit, btnSend),
                ],
            };
        };

        // Preview
        await modalSubmit.reply({ ...renderUI(), flags: MessageFlags.Ephemeral });
        const response = await modalSubmit.fetchReply();

        const collector = response.createMessageComponentCollector({
            time: 300_000, // 5 minutes of limit
        });

        // eslint-disable-next-line sonarjs/cognitive-complexity, complexity
        collector.on('collect', async (itr) => {
            if (itr.customId === 'select_channel' && itr.isChannelSelectMenu()) {
                selectedChannel = itr.channels.first() as TextChannel;
                await itr.update(renderUI());
            } else if (itr.customId === 'select_scope' && itr.isStringSelectMenu()) {
                onlyTargetChannel = itr.values[0] === 'single';
                await itr.update(renderUI());
            } else if (itr.customId === 'select_clusters' && itr.isStringSelectMenu()) {
                selectedClusters = itr.values.filter((val) => val !== 'none');
                await itr.update(renderUI());
            } else if (itr.customId === 'btn_edit' && itr.isButton()) {
                const editModalId = `echo_edit_modal_${itr.id}`;

                const editTextInput = new TextInputBuilder()
                    .setCustomId(textInputId)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setValue(content);

                const editLabel = new LabelBuilder().setLabel('Conteúdo').setTextInputComponent(editTextInput);

                const editModal = new ModalBuilder()
                    .setCustomId(editModalId)
                    .setTitle('Editar Mensagem')
                    .addLabelComponents(editLabel);

                await itr.showModal(editModal);

                try {
                    const editSubmit = await itr.awaitModalSubmit({
                        filter: (modal) => modal.customId === editModalId,
                        time: 300_000,
                    });
                    content = editSubmit.fields.getTextInputValue(textInputId);

                    if (editSubmit.isFromMessage()) {
                        await editSubmit.update(renderUI());
                    }
                } catch {
                    this.logger.warn('Edição cancelada ou tempo esgotado ');
                }
            } else if (itr.customId === 'btn_send' && itr.isButton()) {
                if (!selectedChannel) return; // Fallback

                await itr.update({ content: 'Enviando mensagem...', components: [] });
                collector.stop('sent');

                const dto: BroadcastMessageDTO = {
                    content,
                    files: files.map((att) => ({
                        url: att.url,
                        name: att.name,
                        contentType: att.contentType,
                    })),
                    targetChannel: {
                        guild: { id: selectedChannel.guildId, name: selectedChannel.guild.name },
                        name: selectedChannel.name,
                        id: selectedChannel.id,
                    },
                    onlyTargetChannel,
                    targetClusters: selectedClusters,
                };

                try {
                    await this.messageService.broadcast(dto);
                    await itr.editReply({
                        content: `✅ Mensagem enviada com sucesso!`,
                    });
                    this.logger.log(
                        `${interaction.user.username} broadcasted a message that starts with ${content.slice(0, 50)}...`,
                    );
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Erro desconhecido';
                    await itr.editReply({
                        content: `❌ Erro ao enviar a mensagem: ${message}`,
                    });
                }
            }
        });

        collector.on('end', (_collected, reason) => {
            if (reason !== 'sent') {
                modalSubmit.editReply({ components: [] }).catch(() => {});
            }
        });
    }
}
