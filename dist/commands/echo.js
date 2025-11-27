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
import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder, ChannelType } from 'discord.js';
import logger from "../utils/logger.js";
// Echo serve para replicar uma mensagem para um ou mais canais definidos pelo utilizador
export class EchoCommand extends BaseCommand {
    constructor(bot) {
        super(new SlashCommandBuilder()
            .setName(import.meta.url.split('/').pop().replace('.js', ''))
            .setDescription("Replica uma mensagem para determinado canal")
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addChannelOption(option => option.setName("channel")
            .setDescription("Canal para o qual a mensagem deve ser enviada")
            .setRequired(true)
            // Garante que apenas canais de texto possam ser selecionados
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
            .addStringOption(option => option.setName("message")
            .setDescription("Conteúdo da mensagem")
            .setRequired(true)
            .setMinLength(1))
            .addIntegerOption(option => option.setName('only-for-this-channel')
            .setDescription("Enviar a mensagem apenas no canal especificado?")
            .setRequired(false)
            .addChoices({ name: "true", value: 1 }, { name: "false", value: 0 }))
            .addAttachmentOption(option => option.setName('attachment')
            .setDescription("Anexo")
            .setRequired(false))
            .addAttachmentOption(option => option.setName('attachment2')
            .setDescription("Anexo")
            .setRequired(false)));
        this.bot = bot;
    }
    // Sobrescreve o execute do BaseCommand
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const message = interaction.options.getString("message", true);
                const echoChannel = interaction.options.getChannel("channel", true);
                const attachment = interaction.options.getAttachment("attachment");
                const attachment2 = interaction.options.getAttachment("attachment2");
                const isOnlyForThisChannel = interaction.options.getInteger("only-for-this-channel") === 1;
                const files = [];
                if (attachment)
                    files.push(attachment.url);
                if (attachment2)
                    files.push(attachment2.url);
                const formattedMessage = message.replaceAll("\\n", '\n');
                const payload = { content: formattedMessage, files: files };
                if (isOnlyForThisChannel) {
                    // Cenário 1: Enviar para um canal específico
                    yield echoChannel.send(payload);
                    yield interaction.editReply({
                        content: `✅ Mensagem enviada para ${echoChannel} com sucesso!`,
                    });
                }
                else {
                    // Cenário 2: Enviar para todos os canais com o mesmo nome
                    const targetChannelName = echoChannel.name;
                    const guilds = yield this.bot.client.guilds.cache;
                    const sendPromises = [];
                    // Itera sobre todos os servidores que o bot está
                    for (const partialGuild of guilds.values()) {
                        const guild = yield partialGuild.fetch();
                        const channels = yield guild.channels.cache;
                        // Filtra os canais pelo nome e tipo (texto)
                        const matchingChannels = channels.filter(ch => ch.name === targetChannelName && ch.isTextBased());
                        // Adiciona as promessas de envio a um array
                        for (const channel of matchingChannels.values()) {
                            sendPromises.push(channel.send(payload).catch(err => logger.error(`Falha ao enviar para ${channel.id} em ${guild.name}:`, err)));
                        }
                    }
                    // Espera todas as mensagens serem enviadas
                    yield Promise.all(sendPromises);
                    yield interaction.editReply({
                        content: `✅ Mensagem enviada para canais com o nome "${targetChannelName}".`,
                    });
                }
            }
            catch (error) {
                yield interaction.editReply({ content: "❌ Ocorreu um erro ao executar o comando." });
                throw new Error(error);
            }
        });
    }
}
