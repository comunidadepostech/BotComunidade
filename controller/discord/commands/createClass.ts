import {
    ChannelType,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    MessageFlags
} from "discord.js";
import {Command, CommandContext} from "../../../entities/discordEntities.ts";

export const createClassCommand: Command = {
    name: 'createclass',
    build: new SlashCommandBuilder()
        .setName("createclass")
        .setDescription('Cria uma nova turma')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nome da turma')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('faq-channel')
                .setDescription('Canal de faq da nova turma (obrigatório para novas turmas)')
                .setRequired(true)
                .addChannelTypes([ChannelType.GuildText])
        ),
    execute: async (interaction: ChatInputCommandInteraction, context: CommandContext) => {
        if (!Object.keys(context.featureFlagsService.flags[interaction.guildId!]!).includes("comando_createclass")) {
            await interaction.reply({content: "Comando desabilitado", flags: MessageFlags.Ephemeral})
        }

        // const className = interaction.options.getString('name', true)!;
        // const faqChannel = interaction.options.getChannel("faq-channel", true)!;
        // const channels = interaction.guild?.channels.cache
        // const roles = interaction.guild?.roles.cache
    }
}