import { BaseCommand } from './baseCommand.js';
import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder, ChannelType } from 'discord.js';

// Echo serve para replicar uma mensagem para um ou mais canais definidos pelo utilizador
export class EchoCommand extends BaseCommand {
    constructor(client) {
        super(
            new SlashCommandBuilder()
                .setName("echo")
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
                            { name: "Sim", value: 1 },
                            { name: "Não", value: 0 },
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
                )
        );
        this.client = client
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const message = interaction.options.getString("message", true);
            const echoChannel = interaction.options.getChannel("channel", true);
            const attachment = interaction.options.getAttachment("attachment");
            const attachment2 = interaction.options.getAttachment("attachment2");
            const isOnlyForThisChannel = interaction.options.getInteger("only-for-this-channel") === 1;

            const files = [];
            if (attachment) files.push(attachment.url);
            if (attachment2) files.push(attachment2.url);

            const formattedMessage = message.replace(/\\n/g, '\n');
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
                const guilds = await this.client.guilds.cache;
                const sendPromises = [];

                // Itera sobre todos os servidores que o bot está
                for (const partialGuild of guilds.values()) {
                    const guild = await partialGuild.fetch();
                    const channels = await guild.channels.cache;

                    // Filtra os canais pelo nome e tipo (texto)
                    const matchingChannels = channels.filter(
                        ch => ch.name === targetChannelName && ch.isTextBased()
                    );

                    // Adiciona as promessas de envio a um array
                    for (const channel of matchingChannels.values()) {
                        sendPromises.push(
                            channel.send(payload).catch(err => console.error(`Falha ao enviar para ${channel.id} em ${guild.name}:`, err))
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
            console.error("Ocorreu um erro inesperado no comando /echo:", error);
            const errorMessage = '❌ Ocorreu um erro ao executar o comando. Verifique as permissões do bot no canal de destino.';

            // Garante que o usuário receba uma resposta, mesmo que o deferReply já tenha sido usado
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
}
