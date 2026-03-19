import {
    ChannelType,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    MessageFlags
} from "discord.js";
import {Command, CommandContext} from "../../types/discord.interfaces.ts";
import staticImplements from "../../decorators/staticImplements.ts";

@staticImplements<Command>()
export class createclassCommand {
    static build() {
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

    static async execute(interaction: ChatInputCommandInteraction, context: CommandContext): Promise<void | Error> {
        if (!context.featureFlagsService.flags[interaction.guildId!]!["comando_createclass"]) {
            await interaction.reply({content: "❌ Comando desabilitado", flags: MessageFlags.Ephemeral})
            return;
        }

        const className = interaction.options.getString('name', true)!;
        const faqChannel = interaction.options.getChannel("faq-channel", true)!;

        await interaction.deferReply({flags: MessageFlags.Ephemeral})

        let result = null

        try {
            result = await context.discordService.class.create({className: className, guildId: interaction.guildId!, faqChannelId: faqChannel.id})
        } catch (error: any) {
            await interaction.editReply({content: error.message})
            return
        }

        await interaction.editReply({content: `✅ Turma ${className} criada com sucesso!\n👥 Cargo vinculado: ${result.role}`})
    }
}