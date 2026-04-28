import type { ICommand, ICommandContext } from '../../types/discord.interfaces.ts';
import {
    ChannelType,
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
    type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

export class PollCommand implements ICommand {
    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('poll')
            .setDescription('Cria uma enquete interativa')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption((option) =>
                option
                    .setName('question')
                    .setDescription('Pergunta da enquete')
                    .setRequired(true)
                    .setMaxLength(300),
            )
            .addIntegerOption((option) =>
                option
                    .setName('duration')
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
                        { name: '14 dias', value: 336 },
                    ),
            )
            .addStringOption((option) =>
                option
                    .setName('option1')
                    .setDescription('Primeira opção')
                    .setRequired(true)
                    .setMaxLength(55),
            )
            .addStringOption((option) =>
                option
                    .setName('option2')
                    .setDescription('Segunda opção')
                    .setRequired(true)
                    .setMaxLength(55),
            )
            .addStringOption((option) =>
                option
                    .setName('option3')
                    .setDescription('Terceira opção')
                    .setRequired(false)
                    .setMaxLength(55),
            )
            .addStringOption((option) =>
                option
                    .setName('option4')
                    .setDescription('Quarta opção')
                    .setRequired(false)
                    .setMaxLength(55),
            )
            .addStringOption((option) =>
                option
                    .setName('option5')
                    .setDescription('Quinta opção')
                    .setRequired(false)
                    .setMaxLength(55),
            )
            .addStringOption((option) =>
                option
                    .setName('option6')
                    .setDescription('Sexta opção')
                    .setRequired(false)
                    .setMaxLength(55),
            )
            .addStringOption((option) =>
                option
                    .setName('option7')
                    .setDescription('Setima opção')
                    .setRequired(false)
                    .setMaxLength(55),
            )
            .addStringOption((option) =>
                option
                    .setName('option8')
                    .setDescription('Oitava opção')
                    .setRequired(false)
                    .setMaxLength(55),
            )
            .addStringOption((option) =>
                option
                    .setName('option9')
                    .setDescription('Nona opção')
                    .setRequired(false)
                    .setMaxLength(55),
            )
            .addStringOption((option) =>
                option
                    .setName('option10')
                    .setDescription('Décima opção')
                    .setRequired(false)
                    .setMaxLength(55),
            )
            .addBooleanOption((option) =>
                option
                    .setName('allow-multiselect')
                    .setDescription('Permite múltipla seleção de opções')
                    .setRequired(false),
            )
            .addChannelOption((option) =>
                option
                    .setName('replicate-to')
                    .setDescription(
                        'Canal em que a enquete será replicada (opcional)',
                    )
                    .setRequired(false)
                    .addChannelTypes(ChannelType.GuildText),
            );
    }

    private async createPoll(
        channel: TextChannel,
        context: ICommandContext,
        interaction: ChatInputCommandInteraction,
    ): Promise<void> {
        await context.discordService.messages.createPoll({
            question: { text: interaction.options.getString('question', true) },
            options: [
                interaction.options.getString('option1', true),
                interaction.options.getString('option2', true),
                interaction.options.getString('option3', false),
                interaction.options.getString('option4', false),
                interaction.options.getString('option5', false),
                interaction.options.getString('option6', false),
                interaction.options.getString('option7', false),
                interaction.options.getString('option8', false),
                interaction.options.getString('option9', false),
                interaction.options.getString('option10', false),
            ]
                .filter((option): option is string => option !== null)
                .map((option) => ({ text: option })),
            allowMultiSelect: interaction.options.getBoolean('allow-multiselect', false) === true,
            channel: channel,
            duration: interaction.options.getInteger('duration', true),
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        context: ICommandContext,
    ): Promise<void> {
        if (interaction.channel!.type !== ChannelType.GuildText) {
            throw new Error('Canal inválido');
        }

        const replicateChannel = interaction.options.getChannel(
            'replicate-to',
            false,
        ) as TextChannel;

        try {
            if (replicateChannel) {
                const channels = context.client.channels.cache.filter(
                    (channel) => channel.isTextBased() && channel.name === replicateChannel.name,
                );

                await Promise.all(
                    channels.map((channel) =>
                        this.createPoll(channel as TextChannel, context, interaction),
                    ),
                );
            } else {
                await this.createPoll(interaction.channel as TextChannel, context, interaction);
            }

            await interaction.reply({
                content: '✅ Enquete criada com sucesso!',
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            await interaction.reply({
                content: `❌ Erro ao criar enquete: ${message}`,
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}
