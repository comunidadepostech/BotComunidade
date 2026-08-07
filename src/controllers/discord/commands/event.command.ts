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
import type IEventService from '../../../types/services/eventService.interface.ts';
import { entityType } from '../../../types/entityType.enum.ts';

export default class EventCommand implements ICommand, IController {
    constructor(private eventService: IEventService) {}

    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('event')
            .setDescription('Cria um evento')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption((option) =>
                option.setName('topic').setDescription('Tópico do evento').setRequired(true).setMaxLength(100),
            )
            .addStringOption((option) =>
                option.setName('start-date').setDescription('Data (yyyy-MM-dd)').setRequired(true),
            )
            .addStringOption((option) => option.setName('start-time').setDescription('Hora (HH:mm)').setRequired(true))
            .addStringOption((option) =>
                option.setName('end-date').setDescription('Data (yyyy-MM-dd)').setRequired(true),
            )
            .addStringOption((option) => option.setName('end-time').setDescription('Hora (HH:mm)').setRequired(true))
            .addStringOption((option) =>
                option.setName('description').setDescription('Descrição do evento').setRequired(true),
            )
            .addStringOption((option) =>
                option.setName('link').setDescription('Link do evento ou localização').setRequired(true),
            )
            .addAttachmentOption((option) =>
                option.setName('background').setDescription('Imagem de fundo do evento').setRequired(true),
            )
            .addStringOption((option) =>
                option
                    .setName('replicate-to')
                    .setDescription('Define os servider em que o evento deve se replicar')
                    .setRequired(false),
            )
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        const name = interaction.options.getString('topic', true);
        const startDate = interaction.options.getString('start-date', true);
        const startTime = interaction.options.getString('start-time', true);
        const endDate = interaction.options.getString('end-date', true);
        const endTime = interaction.options.getString('end-time', true);
        const description = interaction.options.getString('description', true);
        const link = interaction.options.getString('link', true);
        const background = interaction.options.getAttachment('background', true);
        const guilds = interaction.options.getString('replicate-to', false) || null;

        if (!background.contentType!.startsWith('image/')) {
            await interaction.reply({
                content: '❌ O arquivo enviado não é uma imagem válida.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const response = await fetch(background.url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await this.eventService.createEvent({
            description: description.replaceAll(String.raw`\n`, '\n'),
            scheduledStartTime: new Date(`${startDate}T${startTime}:00-03:00`),
            scheduledEndTime: new Date(`${endDate}T${endTime}:00-03:00`),
            link: link,
            name,
            image: buffer,
            guilds: guilds ? guilds.split(";") : [interaction.guildId!],
            entityType: entityType.external
        });

        await interaction.reply({ content: '✅ Evento criado com sucesso!', flags: MessageFlags.Ephemeral });
    }
}
