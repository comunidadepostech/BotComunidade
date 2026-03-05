import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import eventCreationDTO from "../../../entities/dto/eventCreationDTO.ts";
import {Command} from "../../../entities/discordEntities.ts";
import EventService from "../../../services/eventService.ts";

export const eventCommand: Command = {
    name: 'event',
    build: new SlashCommandBuilder()
        .setName("event")
        .setDescription('Cria um evento')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('topic')
                .setDescription('Tópico do evento')
                .setRequired(true)
                //.setMaxLength()
        )
        .addStringOption(option =>
            option.setName('start-date')
                .setDescription('Data (yyyy-MM-dd)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('start-time')
                .setDescription('Hora (HH:mm)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('end-date')
                .setDescription('Data (yyyy-MM-dd)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('end-time')
                .setDescription('Hora (HH:mm)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Descrição do evento')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Link do evento')
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option.setName("background")
                .setDescription("Imagem de fundo do evento")
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const topic = interaction.options.getString('topic')!;
        const startDate = interaction.options.getString('start-date')!;
        const startTime = interaction.options.getString('start-time')!;
        const endDate = interaction.options.getString('end-date')!;
        const endTime = interaction.options.getString('end-time')!;
        const description = interaction.options.getString('description')!;
        const link = interaction.options.getString('link')!;
        const background = interaction.options.getAttachment('background')!;

        if (!background.contentType!.startsWith('image/')) {
            await interaction.reply({
                content: '❌ O arquivo enviado não é uma imagem válida.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const response = await fetch(background.url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const payload: eventCreationDTO = {
            origin: "command",
            topic: topic,
            startDatetime: new Date(`${startDate}T${startTime}:00-03:00`),
            endDatetime: new Date(`${endDate}T${endTime}:00-03:00`),
            guild: interaction.guild!,
            description: description.replaceAll(String.raw`\n`, '\n'),
            link: link,
            background: `data:image/png;base64,${buffer.toString('base64')}`
        }

        try {
            await EventService.createEvent(payload);
            await interaction.reply({ content: "✅ Evento criado com sucesso!", flags: MessageFlags.Ephemeral })
        } catch (error: any) {
            await interaction.reply({ content: `❌ Erro ao criar o evento: ${error.message}}`, flags: MessageFlags.Ephemeral });
        }
    }
}