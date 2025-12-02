import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, PollLayoutType, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, PollQuestionMedia} from 'discord.js';

// Poll serve para criar uma enquete
export default class PollCommand extends BaseCommand {
    constructor() {
        super(
            new SlashCommandBuilder()
                .setName(import.meta.url.split('/').pop()!.replace('.js', ''))
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
                            { name: '7 dias', value: 168 },
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
                .addIntegerOption(option =>
                    option.setName('allow-multiselect')
                        .setDescription('Permite múltipla seleção de opções (padrão: 0 para false)')
                        .setRequired(false)
                        .addChoices(
                            { name: 'true', value: 1 },
                            { name: 'false', value: 0 }
                        )
                ),
        { alwaysEnabled: false }
        )
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const question = interaction.options.getString('question')!;
            const duration = interaction.options.getInteger('duration')!;
            const multiselect = interaction.options.getInteger('allow-multiselect') === 1;
            const options = [
                interaction.options.getString('option1')!,
                interaction.options.getString('option2')!,
                interaction.options.getString('option3'),
                interaction.options.getString('option4'),
                interaction.options.getString('option5'),
                interaction.options.getString('option6'),
                interaction.options.getString('option7'),
                interaction.options.getString('option8'),
                interaction.options.getString('option9'),
                interaction.options.getString('option10')
            ].filter(Boolean); // Remove opções vazias

            let filteredOptions = options.filter(option => option !== null && option !== undefined);
            const pollAnswers = filteredOptions.map(option => ({text: option}));

            if (interaction.channel!.type !== ChannelType.GuildText) {
                throw new Error("Canal não encontrado");
            }

            await interaction.channel!.send({
                poll: {
                    question: {text: question},
                    answers: pollAnswers,
                    allowMultiselect: multiselect,
                    duration: duration,
                    layoutType: PollLayoutType.Default
                }
            });

            await interaction.reply({content: "✅ Enquete criada com sucesso!", flags: MessageFlags.Ephemeral});

        } catch (error) {
            await interaction.reply({
                content: "❌ Ocorreu um erro ao criar a enquete.\n" + error,
                flags: MessageFlags.Ephemeral
            });
            throw new Error("Falha ao crar enquete" + error)
        }
    }
}