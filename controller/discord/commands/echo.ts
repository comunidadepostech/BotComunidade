import {
    Attachment,
    ChannelType,
    ChatInputCommandInteraction, MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder, TextChannel
} from "discord.js";
import {Command, CommandContext} from "../../../entities/discordEntities.ts";
import {BroadcastMessageDTO} from "../../../entities/dto/broadcastMessageDTO.ts";
import echo from "../../../services/commandsServices/echo.ts";

export const echoCommand: Command = {
    name: 'echo',
    build: new SlashCommandBuilder()
        .setName("echo")
        .setDescription("Replica uma mensagem para todos os canais com mesmo nome ou para apenas um canal em específico.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Canal que a mensagem deve ser enviada")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
        .addStringOption(option =>
            option.setName("message")
                .setDescription("Conteúdo da mensagem")
                .setRequired(true)
                .setMinLength(1)
        )
        .addBooleanOption(option =>
            option.setName('only-for-this-channel')
                .setDescription("Envia a mensagem apenas no canal especificado.")
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option.setName('attachment')
                .setDescription("attachment")
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option.setName('attachment-2')
                .setDescription("attachment-2")
                .setRequired(false)
        ),
    execute: async (interaction: ChatInputCommandInteraction, context: CommandContext) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const echoChannel: TextChannel = interaction.options.getChannel("channel", true);
        const attachment = interaction.options.getAttachment("attachment");
        const attachment2 = interaction.options.getAttachment("attachment-2");

        const dto: BroadcastMessageDTO = {
            content: interaction.options.getString("message", true),
            files: [attachment, attachment2]
                .filter((att): att is Attachment => att !== null)
                .map(att => ({ attachment: att.url, name: att.name })),
            targetChannel: echoChannel,
            onlyTargetChannel: interaction.options.getBoolean("only-for-this-channel") === true,
            client: context.client
        };

        try{
            await echo(dto)
            await interaction.editReply({content: `✅ Mensagem enviada para ${dto.targetChannel} com sucesso!`});
        } catch (error: any) {
            await interaction.editReply({ content: `❌ Nenhum canal encontrado com o nome "${dto.targetChannel.name}".`});
        }
    }
}