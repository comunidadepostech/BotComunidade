import {
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";

export class EventCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName("event")
            .setDescription('Cria um evento')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(option =>
                    option.setName('topic')
                        .setDescription('Tópico do evento')
                        .setRequired(true)
                .setMaxLength(100)
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
            )
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void> {
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

        try {
            await context.discordService.events.create({
                topic: topic,
                startDatetime: new Date(`${startDate}T${startTime}:00-03:00`),
                endDatetime: new Date(`${endDate}T${endTime}:00-03:00`),
                description: description.replaceAll(String.raw`\n`, '\n'),
                link: link,
                background: `data:image/png;base64,${buffer.toString('base64')}`,
                source: "command",
                guildId: interaction.guildId!
            });
            await interaction.reply({ content: "✅ Evento criado com sucesso!", flags: MessageFlags.Ephemeral })
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro desconhecido"
            await interaction.reply({ content: `❌ Erro ao criar o evento: ${message}}`, flags: MessageFlags.Ephemeral });
        }
    }
}