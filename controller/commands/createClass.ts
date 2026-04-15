import {
    ChannelType,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    MessageFlags,
    type SlashCommandOptionsOnlyBuilder
} from "discord.js";
import type {ICommand, ICommandContext} from "../../types/discord.interfaces.ts";

export class CreateclassCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
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
            )
    }

    async execute(interaction: ChatInputCommandInteraction, context: ICommandContext): Promise<void> {
        if (!context.featureFlagsService.getFlag(interaction.guildId!, "comando_createclass")) {
            await interaction.reply({content: "❌ Comando desabilitado", flags: MessageFlags.Ephemeral})
            return;
        }

        const className = interaction.options.getString('name', true)!;
        const faqChannel = interaction.options.getChannel("faq-channel", true)!;

        await interaction.deferReply({flags: MessageFlags.Ephemeral})

        try {
            const result = await context.discordService.class.create({
                className: className,
                guildId: interaction.guildId!,
                faqChannelId: faqChannel.id
            })
            await interaction.editReply({content: `✅ Turma ${className} criada com sucesso!\n👥 Cargo vinculado: ${result.role}`})
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erro desconhecido"
            await interaction.editReply({content: `❌ Erro: ${message}`})
        }
    }
}