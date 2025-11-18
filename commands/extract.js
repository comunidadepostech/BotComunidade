import { BaseCommand } from './baseCommand.js';
import {AttachmentBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class ExtractCommand extends BaseCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName("extract")
                .setDescription("Extrai o conteúdo do chat e retorna um arquivo .txt")
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        )
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const channel = interaction.channel;
        let allMessages = new Map();
        let lastId;

        // Busca todas as mensagens em lotes de 100
        while (true) {
            const options = { limit: 100 };
            if (lastId) options.before = lastId;
            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) break;
            messages.forEach(message => allMessages.set(message.id, message));
            lastId = messages.last().id;
        }

        // Ordena as mensagens em ordem cronológica e inclui apenas as que têm conteúdo de texto
        const sortedMessages = Array.from(allMessages.values())
            .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
            .filter(msg => {
                const content = msg.content.trim();
                if (!content) return false;
                // Ignora mensagens com formatação/markup indesejado
                return !(content.includes('\\-\\-boundary') ||
                    content.includes('Content-Disposition') ||
                    content.startsWith('poll:') ||
                    /^<t:\d+(:[a-zA-Z])?>$/.test(content));

            });

        // Formata as mensagens com data, usuário e mensagem
        let output = "";
        sortedMessages.forEach(msg => {
            output += `[${msg.createdAt.toLocaleString("pt-BR")}] ${msg.author.tag}: ${msg.content}\n\n`;
        });

        const textBuffer = Buffer.from(output, "utf-8");
        const fileAttachment = new AttachmentBuilder(textBuffer, { name: "chat_history.txt" });

        await interaction.editReply({ content: "Histórico coletado:", files: [fileAttachment] });

        // limpa o cache e as mensagens para economizar memória
        channel.messages.cache.clear();
        allMessages = null;
    }
}