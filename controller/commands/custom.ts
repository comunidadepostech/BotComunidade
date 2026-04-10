import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    TextChannel,
    MessageFlags,
    Attachment,
    type SlashCommandOptionsOnlyBuilder
} from 'discord.js';
import type {ICommand} from "../../types/discord.interfaces.ts";

export class CustomCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName("custom")
            .setDescription('Publica uma mensagem baseada em um arquivo JSON do Discord Builders.')
            .addAttachmentOption(options =>
                options.setName("json")
                    .setRequired(true)
                    .setDescription("O texto json gerado pelo site discord.builders")
            )
            .addAttachmentOption(option => option.setName('attachment1').setDescription('Primeiro anexo').setRequired(false))
            .addAttachmentOption(option => option.setName('attachment2').setDescription('Segundo anexo').setRequired(false))
            .addAttachmentOption(option => option.setName('attachment3').setDescription('Terceiro anexo').setRequired(false))
            .addAttachmentOption(option => option.setName('attachment4').setDescription('Quarto anexo').setRequired(false))
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const attachment = interaction.options.getAttachment('json', true);

        if (!attachment.contentType?.includes('application/json') && !attachment.name.endsWith('.json')) {
            await interaction.editReply('❌ O arquivo enviado não é um JSON válido.');
            return;
        }

        const response = await fetch(attachment.url);
        if (!response.ok) throw new Error('Falha ao baixar o arquivo JSON.');

        const json: unknown = await response.json();

        // Coleta todos os anexos de imagem fornecidos em um array
        const attachments: Attachment[] = [];
        for (let i = 1; i <= 4; i++) {
            const file = interaction.options.getAttachment(`attachment${i}`);
            if (file) attachments.push(file);
        }

        try {
            if (interaction.channel?.isTextBased()) {
                const channel = interaction.channel as TextChannel;

                await channel.send({
                    components: json,
                    flags: MessageFlags.IsComponentsV2,
                    files: attachments
                });

                await interaction.editReply('✅ Mensagem publicada com sucesso!');
            }
        } catch (error) {
            await interaction.editReply(`Houve um erro. Verifique a estrutura do JSON e os arquivos enviados.\n${error}`);
        }
    }
}