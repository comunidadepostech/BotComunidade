import {Command, CommandContext} from "../../types/discord.interfaces.ts";
import {
    ChannelType,
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import staticImplements from "../../decorators/staticImplements.ts";

@staticImplements<Command>()
export class pollCommand {
    static build() {
        return new SlashCommandBuilder()
            .setName("poll")
            .setDescription('Cria uma enquete interativa')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(option =>
                option.setName('question')
                    .setDescription('Pergunta da enquete')
                    .setRequired(true)
                    .setMaxLength(300)
            )
            .addIntegerOption(option =>
                option.setName('duration')
                    .setDescription('Duração da enquete em horas')
                    .setRequired(true)
                    .addChoices(
                        { name: '1 hora', value: 1 },
                        { name: '2 horas', value: 2 },
                        { name: '6 horas', value: 6 },
                        { name: '12 horas', value: 12 },
                        { name: '1 dia', value: 24 },
                        { name: '3 dias', value: 72 },
                        { name: '5 dias', value: 120 },
                        { name: '7 dias (recomendado)', value: 168 },
                        { name: '14 dias', value: 336}
                    )
            )
            .addStringOption(option =>
                option.setName('option1')
                    .setDescription('Primeira opção')
                    .setRequired(true)
                    .setMaxLength(55))
            .addStringOption(option =>
                option.setName('option2')
                    .setDescription('Segunda opção')
                    .setRequired(true)
                    .setMaxLength(55))
            .addStringOption(option =>
                option.setName('option3')
                    .setDescription('Terceira opção')
                    .setRequired(false)
                    .setMaxLength(55))
            .addStringOption(option =>
                option.setName('option4')
                    .setDescription('Quarta opção')
                    .setRequired(false)
                    .setMaxLength(55))
            .addStringOption(option =>
                option.setName('option5')
                    .setDescription('Quinta opção')
                    .setRequired(false)
                    .setMaxLength(55))
            .addStringOption(option =>
                option.setName('option6')
                    .setDescription('Sexta opção')
                    .setRequired(false)
                    .setMaxLength(55))
            .addStringOption(option =>
                option.setName('option7')
                    .setDescription('Setima opção')
                    .setRequired(false)
                    .setMaxLength(55))
            .addStringOption(option =>
                option.setName('option8')
                    .setDescription('Oitava opção')
                    .setRequired(false)
                    .setMaxLength(55))
            .addStringOption(option =>
                option.setName('option9')
                    .setDescription('Nona opção')
                    .setRequired(false)
                    .setMaxLength(55))
            .addStringOption(option =>
                option.setName('option10')
                    .setDescription('Décima opção')
                    .setRequired(false)
                    .setMaxLength(55))
            .addBooleanOption(option =>
                option.setName('allow-multiselect')
                    .setDescription('Permite múltipla seleção de opções (padrão: 0 para false)')
                    .setRequired(false)
            )
    }

    static async execute(interaction: ChatInputCommandInteraction, context: CommandContext): Promise<void | Error> {
        if (interaction.channel!.type !== ChannelType.GuildText) {
            throw new Error("Canal inválido");
        }

        try {
            await context.discordService.messages.createPoll({
                question: {text: interaction.options.getString("question", true)},
                options: [
                    interaction.options.getString("option1", true),
                    interaction.options.getString("option2", true),
                    interaction.options.getString("option3", false),
                    interaction.options.getString("option4", false),
                    interaction.options.getString("option5", false),
                    interaction.options.getString("option6", false),
                    interaction.options.getString("option7", false),
                    interaction.options.getString("option8", false),
                    interaction.options.getString("option9", false),
                    interaction.options.getString("option10", false),
                ].filter((option): option is string => option !== null).map(option => ({text: option})),
                allowMultiSelect: interaction.options.getBoolean("allow-multiselect", false) === true,
                channel: interaction.channel!,
                duration: interaction.options.getInteger("duration", true)
            })
            await interaction.reply({content: "✅ Enquete criada com sucesso!", flags: MessageFlags.Ephemeral});
        } catch (error: any) {
            await interaction.reply({content: `❌ Erro ao criar enquete: ${error.message}`, flags: MessageFlags.Ephemeral});
        }
    }
}