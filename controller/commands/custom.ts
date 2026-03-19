import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    TextChannel,
    MessageFlags,
    Attachment
} from 'discord.js';
import {Command} from "../../types/discord.interfaces.ts";
import staticImplements from "../../decorators/staticImplements.ts";

@staticImplements<Command>()
export class customCommand {
    static build() {
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

    static async execute(interaction: ChatInputCommandInteraction): Promise<void | Error> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const json = JSON.parse(interaction.options.getString('json', true));

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