import {
    ChannelType,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    MessageFlags
} from "discord.js";
import {Command, CommandContext} from "../../../entities/discordEntities.ts";
import ClassService from "../../../services/classService.ts";

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
        if (!context.featureFlagsService.flags[interaction.guildId!]!["comando_createclass"]) {
            await interaction.reply({content: "❌ Comando desabilitado", flags: MessageFlags.Ephemeral})
            return;
        }

        const className = interaction.options.getString('name', true)!;
        const faqChannel = interaction.options.getChannel("faq-channel", true)!;

        await interaction.deferReply({flags: MessageFlags.Ephemeral})

        const classServeice = new ClassService()
        const creationResult = await classServeice.create(interaction, className, faqChannel.id)

        if (!creationResult.success) {
            await interaction.editReply({content: creationResult.message})
        }

        await interaction.editReply({content: `✅ Turma ${className} criada com sucesso!\n👥 Cargo vinculado: ${creationResult.role}\n🔗Link do convite: ${creationResult.inviteUrl} <- Delete esse invite e crie um manualmente enquanto esse aviso existir.`})
    }
}