import { BaseCommand } from './baseCommand.js';
import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder, ChannelType, ChatInputCommandInteraction, TextChannel, GuildBasedChannel, Attachment, GuildTextBasedChannel } from 'discord.js';
import logger from "../utils/logger.js";
import { Bot } from '../bot.js';

// Echo serve para replicar uma mensagem para um ou mais canais definidos pelo utilizador
export class EchoCommand extends BaseCommand {
    bot: Bot;
    constructor(bot: Bot) {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.js', ''))
                .setDescription("Replica uma mensagem para determinado canal")
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addChannelOption(option =>
                    option.setName("channel")
                        .setDescription("Canal para o qual a mensagem deve ser enviada")
                        .setRequired(true)
                        // Garante que apenas canais de texto possam ser selecionados
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
                .addStringOption(option =>
                    option.setName("message")
                        .setDescription("Conteúdo da mensagem")
                        .setRequired(true)
                        .setMinLength(1)
                )
                .addIntegerOption(option =>
                    option.setName('only-for-this-channel')
                        .setDescription("Enviar a mensagem apenas no canal especificado?")
                        .setRequired(false)
                        .addChoices(
                            { name: "true", value: 1 },
                            { name: "false", value: 0 },
                        )
                )
                .addAttachmentOption(option =>
                    option.setName('attachment')
                        .setDescription("Anexo")
                        .setRequired(false)
                )
                .addAttachmentOption(option =>
                    option.setName('attachment2')
                        .setDescription("Anexo")
                        .setRequired(false)
                ),
            { alwaysEnabled: false }
        );
        this.bot = bot
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const message: string = interaction.options.getString("message", true);
            const echoChannel: TextChannel = interaction.options.getChannel("channel", true);
            const attachment: Attachment | null = interaction.options.getAttachment("attachment");
            const attachment2: Attachment | null = interaction.options.getAttachment("attachment2");
            const isOnlyForThisChannel = interaction.options.getInteger("only-for-this-channel") === 1;

            const files = [];
            if (attachment) files.push(attachment.url);
            if (attachment2) files.push(attachment2.url);

            const formattedMessage = message.replaceAll(String.raw`\n`, '\n');
            const payload = { content: formattedMessage, files: files };

            if (isOnlyForThisChannel) {
                // Cenário 1: Enviar para um canal específico
                await echoChannel.send(payload);
                await interaction.editReply({
                    content: `✅ Mensagem enviada para ${echoChannel} com sucesso!`,
                });
            } else {
                // Cenário 2: Enviar para todos os canais com o mesmo nome
                const targetChannelName = echoChannel.name;
                const guilds = this.bot.client.guilds.cache.values();
                const sendPromises = [];

                // Itera sobre todos os servidores que o bot está
                for (const partialGuild of guilds) {
                    const channels = partialGuild.channels.cache;

                    // Filtra os canais pelo nome
                    const matchingChannels = channels.filter(channel => channel.name === targetChannelName);

                    // Adiciona as promessas de envio a um array
                    for (const channel of matchingChannels.values()) {
                        if (!channel.isTextBased()) continue // não precisa disso mas o TS reclama se não colocar :)
                        sendPromises.push(
                            channel.send(payload).catch((err: any) => logger.error(`Falha ao enviar para ${channel.id} em ${partialGuild.name}:\n${err}`))
                        );
                    }
                }

                // Espera todas as mensagens serem enviadas
                await Promise.all(sendPromises);

                await interaction.editReply({
                    content: `✅ Mensagem enviada para canais com o nome "${targetChannelName}".`,
                });
            }

        } catch (error) {
            await interaction.editReply({ content: "❌ Ocorreu um erro ao executar o comando." });
            throw new Error(error as string);
        }
    }
}
