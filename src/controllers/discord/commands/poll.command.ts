import type ICommand from '../../../types/interfaces/command.interface.ts';
import {
    ChannelType,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    InteractionContextType,
    type SlashCommandOptionsOnlyBuilder,
    MessageFlags,
} from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface.ts';
import type PollMessageDTO from '../../../types/dtos/pollMessage.dto.ts';
import type IMessageService from '../../../types/services/messageService.interface.ts';
import { IncompatibleChannelError } from '../../../types/errors.types.ts';
import type { Channel } from '../../../types/channel.types.ts';
import type ILoggerService from '../../../types/services/loggerService.interface.ts';

export default class PollCommand implements ICommand, IController {
    constructor(
        private messageService: IMessageService,
        private logger: ILoggerService,
    ) {}

    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('poll')
            .setDescription('Cria uma enquete interativa')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts(InteractionContextType.Guild)
            .addStringOption((option) =>
                option.setName('question').setDescription('Pergunta da enquete').setRequired(true).setMaxLength(300),
            )
            .addNumberOption((option) =>
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
                    )
                    .setMinValue(1)
                    .setMaxValue(336),
            )
            .addStringOption((option) =>
                option.setName('option1').setDescription('Primeira opção').setRequired(true).setMaxLength(55),
            )
            .addStringOption((option) =>
                option.setName('option2').setDescription('Segunda opção').setRequired(true).setMaxLength(55),
            )
            .addStringOption((option) =>
                option.setName('option3').setDescription('Terceira opção').setRequired(false).setMaxLength(55),
            )
            .addStringOption((option) =>
                option.setName('option4').setDescription('Quarta opção').setRequired(false).setMaxLength(55),
            )
            .addStringOption((option) =>
                option.setName('option5').setDescription('Quinta opção').setRequired(false).setMaxLength(55),
            )
            .addStringOption((option) =>
                option.setName('option6').setDescription('Sexta opção').setRequired(false).setMaxLength(55),
            )
            .addStringOption((option) =>
                option.setName('option7').setDescription('Setima opção').setRequired(false).setMaxLength(55),
            )
            .addStringOption((option) =>
                option.setName('option8').setDescription('Oitava opção').setRequired(false).setMaxLength(55),
            )
            .addStringOption((option) =>
                option.setName('option9').setDescription('Nona opção').setRequired(false).setMaxLength(55),
            )
            .addStringOption((option) =>
                option.setName('option10').setDescription('Décima opção').setRequired(false).setMaxLength(55),
            )
            .addBooleanOption((option) =>
                option
                    .setName('allow-multiselect')
                    .setDescription('Múltipla seleção (padrão: false)')
                    .setRequired(false),
            )
            .addChannelOption((option) =>
                option
                    .setName('replicate-to')
                    .setDescription('Canal em que a enquete será replicada (opcional)')
                    .setRequired(false)
                    .addChannelTypes(ChannelType.GuildText),
            )
            .addStringOption((option) =>
                option
                    .setName('guild-id')
                    .setDescription('Id dos servidores para enviar (separe por ; sem espaços)')
                    .setRequired(false),
            );
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const replicateChannel = interaction.options.getChannel('replicate-to', false, [ChannelType.GuildText]);

        const guildIds = interaction.options.getString('guild-id', false)?.split(';');

        const options = [
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
        ].filter((option) => option !== null);

        const poll: PollMessageDTO = {
            question: interaction.options.getString('question', true),
            answers: options.map((option) => {
                if (/\p{Extended_Pictographic}/u.test(option[0]!)) {
                    return { text: option.slice(1).trim(), emoji: option[0]! };
                }
                return { text: option };
            }),
            allowMultiSelect: interaction.options.getBoolean('allow-multiselect', false) || false,
            duration: interaction.options.getNumber('duration', true),
        };

        if (replicateChannel) {
            let guilds = Array.from(interaction.client.guilds.cache.values());
            const channels: Channel[] = [];

            if (guildIds) {
                guilds = guilds.filter((guild) => guildIds.includes(guild.id));
            }

            for (const guild of guilds) {
                try {
                    const guildChannelsCollection = await guild.channels.fetch();

                    const matchingChannels = guildChannelsCollection.filter(
                        (ch) => ch !== null && ch.name === replicateChannel.name && ch.isTextBased() && ch.isSendable(),
                    );

                    matchingChannels.values().map((channel) =>
                        channels.push({
                            guild: channel!.guild,
                            name: channel!.name,
                            id: channel!.id,
                        }),
                    );
                } catch (error: any) {
                    this.logger.error(`Error finding channels of ${guild.name}`, error);
                }

                await Bun.sleep(100);
            }

            if (channels.length === 0) {
                await interaction.editReply({
                    content: '❌ Nenhum canal de texto correspondente foi encontrado nos servidores elegíveis.',
                });
            }

            await this.messageService.sendPoll(poll, channels);
        } else {
            // Send only in this channel
            const channel = await interaction.channel!.fetch();

            if (channel.isDMBased() || channel.isThread()) {
                throw new IncompatibleChannelError(
                    interaction.channel!.type.toString(),
                    'some guild text channel',
                    this.constructor.name,
                );
            }

            await this.messageService.sendPoll(poll, [
                {
                    id: channel.id,
                    guild: { id: channel.guild.id, name: channel.guild.name },
                    name: channel.name,
                    parent: channel.parent ? { id: channel.parent.id, name: channel.parent.name } : undefined,
                },
            ]);
        }

        await interaction.editReply({
            content: '✅ Enquete criada.',
        });
    }
}
