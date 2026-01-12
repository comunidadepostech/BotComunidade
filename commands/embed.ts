import {ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType} from 'discord.js'
import Bot from '../bot.ts';
import {BaseCommand} from "./baseCommand.ts";

export default class EmbedCommand extends BaseCommand {
    readonly bot: Bot;

    constructor(bot: Bot) {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.ts', ''))
                .setDescription('Envia um Embed no chat atual')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('Conteúdo da mensagem')
                        .setRequired(false)
                        .setMaxLength(2000)
                )
                .addAttachmentOption(option =>
                    option.setName("attachment1")
                        .setDescription('Imagem para anexar')
                )
                .addAttachmentOption(option =>
                    option.setName("attachment2")
                        .setDescription('Imagem para anexar')
                )
                .addAttachmentOption(option =>
                    option.setName("attachment3")
                        .setDescription('Imagem para anexar')
                )

            ,
            {alwaysEnabled: false}
        )
        this.bot = bot
    }

    override execute(interaction: ChatInputCommandInteraction) {
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('Some title')
            .setURL('https://discord.js.org/')
            .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
            .setDescription('Some description here')
            .setThumbnail('https://i.imgur.com/AfFp7pu.png')
            .addFields(
                { name: 'Regular field title', value: 'Some value here' },
                { name: '\u200B', value: '\u200B' },
                { name: 'Inline field title', value: 'Some value here', inline: true },
                { name: 'Inline field title', value: 'Some value here', inline: true },
            )
            .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
            .setImage('https://i.imgur.com/AfFp7pu.png')
            .setTimestamp()
            .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

        if (interaction.channel?.type === ChannelType.GuildText) {
            interaction.channel.send({ embeds: [embed] });
        }
    }
}
