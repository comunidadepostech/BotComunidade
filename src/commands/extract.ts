import { BaseCommand } from './baseCommand.js';
import {AttachmentBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction, TextChannel} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class ExtractCommand extends BaseCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.js', ''))
                .setDescription("Extrai o conteúdo do chat e retorna um arquivo .txt")
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
            { alwaysEnabled: false }
        )
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const channel = interaction.channel!;
        let allMessages = new Map();
        let lastId;
        
        interface Options {
            limit: number;
            before?: string;
        }

        // Busca todas as mensagens em lotes de 100
        while (true) {
            const options: Options = { limit: 100 };
            if (lastId) options.before = lastId;
            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) break;
            for (const [, message] of messages) {
                allMessages.set(message.id, message)
            }
            lastId = messages.last()!.id;
        }

        // Ordena as mensagens em ordem cronológica e inclui apenas as que têm conteúdo de texto
        const sortedMessages = Array.from(allMessages.values())
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
            .filter(msg => msg.content?.trim());

        // Formata as mensagens com data, usuário e mensagem
        let output = "";
        for (let message of sortedMessages) {
            output += `[${message.createdAt.toLocaleString("pt-BR")}] ${message.author.tag}: ${message.content}\n\n`;
        }

        const textBuffer = Buffer.from(output, "utf-8");
        const fileAttachment = new AttachmentBuilder(textBuffer, { name: "chat_history.txt" });

        await interaction.editReply({ content: "Histórico coletado:", files: [fileAttachment] });
    }
}