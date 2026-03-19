import {
    Attachment,
    ChannelType,
    ChatInputCommandInteraction, MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder, TextChannel
} from "discord.js";
import {Command, CommandContext} from "../../types/discord.interfaces.ts";
import {BroadcastMessageDto} from "../../dtos/broadcastMessage.dto.ts";
import staticImplements from "../../decorators/staticImplements.ts";


@staticImplements<Command>()
export class echoCommand {
    static build() {
        return new SlashCommandBuilder()
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
            )
    }

    static async execute(interaction: ChatInputCommandInteraction, context: CommandContext): Promise<void | Error> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const echoChannel: TextChannel = interaction.options.getChannel("channel", true);
        const attachment = interaction.options.getAttachment("attachment");
        const attachment2 = interaction.options.getAttachment("attachment-2");

        const dto: BroadcastMessageDto = {
            content: interaction.options.getString("message", true),
            files: [attachment, attachment2].filter((att): att is Attachment => att !== null),
            targetChannel: echoChannel,
            onlyTargetChannel: interaction.options.getBoolean("only-for-this-channel") === true
        }

        try{
            await context.discordService.messages.broadcast(dto)
            await interaction.editReply({content: `✅ Mensagem enviada para ${dto.targetChannel} com sucesso!`});
        } catch (error: any) {
            await interaction.editReply({ content: `❌ Nenhum canal encontrado com o nome "${dto.targetChannel.name}".`});
        }
    }
}