var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BaseCommand } from './baseCommand.js';
import { AttachmentBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class ExtractCommand extends BaseCommand {
    constructor() {
        super(new SlashCommandBuilder()
            .setName(import.meta.url.split('/').pop().replace('.js', ''))
            .setDescription("Extrai o conteúdo do chat e retorna um arquivo .txt")
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator));
    }
    // Sobrescreve o execute do BaseCommand
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const channel = interaction.channel;
            let allMessages = new Map();
            let lastId;
            // Busca todas as mensagens em lotes de 100
            while (true) {
                const options = { limit: 100 };
                if (lastId)
                    options.before = lastId;
                const messages = yield channel.messages.fetch(options);
                if (messages.size === 0)
                    break;
                for (const [, message] of messages) {
                    allMessages.set(message.id, message);
                }
                lastId = messages.last().id;
            }
            // Ordena as mensagens em ordem cronológica e inclui apenas as que têm conteúdo de texto
            const sortedMessages = Array.from(allMessages.values())
                .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                .filter(msg => { var _a; return (_a = msg.content) === null || _a === void 0 ? void 0 : _a.trim(); });
            // Formata as mensagens com data, usuário e mensagem
            let output = "";
            for (let message of sortedMessages) {
                output += `[${message.createdAt.toLocaleString("pt-BR")}] ${message.author.tag}: ${message.content}\n\n`;
            }
            const textBuffer = Buffer.from(output, "utf-8");
            const fileAttachment = new AttachmentBuilder(textBuffer, { name: "chat_history.txt" });
            yield interaction.editReply({ content: "Histórico coletado:", files: [fileAttachment] });
        });
    }
}
