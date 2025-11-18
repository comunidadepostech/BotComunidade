import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class EventCommand extends BaseCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName('event')
                .setDescription('Cria um evento')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addStringOption(option =>
                    option.setName('topic')
                        .setDescription('Tópico do evento')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('date')
                        .setDescription('Data (yyyy-MM-dd)')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('time')
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
                )
        )
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        const topic = interaction.options.getString('topic');
        const date = interaction.options.getString('date');
        const time = interaction.options.getString('time');
        const description = interaction.options.getString('description');
        const link = interaction.options.getString('link');
        const background = interaction.options.getAttachment('background');

        if (!background.contentType.startsWith('image/')) {
            return await interaction.reply({
                content: '❌ O arquivo enviado não é uma imagem válida.',
                ephemeral: true
            });
        }

        const response = await fetch(background.url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await interaction.guild.scheduledEvents.create({
            name: topic,
            scheduledStartTime: new Date(`${date}T${time}:00-03:00`),
            scheduledEndTime: new Date(new Date(`${date}T${time}:00-03:00`).getTime() + 180 * 60 * 1000), // Duração padrão de 3 horas
            privacyLevel: 2, // Guild Only
            entityType: 3, // External
            description: description.replace(/\\n/g, '\n'),
            image: `data:image/png;base64,${buffer.toString('base64')}`,
            entityMetadata: {location: link}
        })

        await interaction.reply({ content: "✅ Evento criado com sucesso!", flags: MessageFlags.Ephemeral });
    }
}