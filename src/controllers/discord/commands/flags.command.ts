import type ICommand from '../../../types/interfaces/command.interface.ts';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ContainerBuilder,
    InteractionContextType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextDisplayBuilder,
    type MessageActionRowComponentBuilder,
    type SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface.ts';
import type IFeatureFlagsService from '../../../types/services/featureFlagsService.interface.ts';
import type ILoggerService from '../../../types/services/loggerService.interface.ts';

const TOGGLE_PREFIX = 'ff_toggle:';
const LABEL_PREFIX = 'ff_label:';
const MAX_ROWS_FIRST_CONTAINER = 9;
const MAX_ROWS_OTHER_CONTAINERS = 10;

export default class FlagsCommand implements ICommand, IController {
    constructor(
        private featureFlagsService: IFeatureFlagsService,
        private logger: ILoggerService,
    ) {}

    build(): SlashCommandOptionsOnlyBuilder {
        return new SlashCommandBuilder()
            .setName('flags')
            .setDescription('Retorna as feature flags do Bot e seus estados no servidor atual')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setContexts(InteractionContextType.Guild);
    }

    async handle(interaction: ChatInputCommandInteraction): Promise<void> {
        const guildId = interaction.guildId;
        if (!guildId) return; // Fallback

        let flags = await this.featureFlagsService.getFlagsByGuildId(guildId);

        const buildFlagRow = (
            flagKey: string,
            isEnabled: boolean,
            disabled: boolean,
        ): ActionRowBuilder<MessageActionRowComponentBuilder> => {
            const nameButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel(flagKey)
                .setDisabled(true)
                .setCustomId(`${LABEL_PREFIX}${flagKey}`);

            const toggleButton = new ButtonBuilder()
                .setStyle(isEnabled ? ButtonStyle.Success : ButtonStyle.Danger)
                .setLabel(isEnabled ? 'Ativada' : 'Desativada')
                .setDisabled(disabled)
                .setCustomId(`${TOGGLE_PREFIX}${flagKey}`);

            return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(nameButton, toggleButton);
        };

        const buildContainers = (disabled = false): ContainerBuilder[] => {
            const flagKeys = Object.keys(flags);
            const containers: ContainerBuilder[] = [];

            let index = 0;
            let isFirst = true;

            while (index < flagKeys.length) {
                const chunkSize = isFirst ? MAX_ROWS_FIRST_CONTAINER : MAX_ROWS_OTHER_CONTAINERS;
                const chunk = flagKeys.slice(index, index + chunkSize);

                const container = new ContainerBuilder();

                if (isFirst) {
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('## Feature Flags do Servidor'),
                    );
                }

                for (const flagKey of chunk) {
                    container.addActionRowComponents(buildFlagRow(flagKey, flags[flagKey]!, disabled));
                }

                containers.push(container);
                index += chunk.length;
                isFirst = false;
            }

            if (containers.length === 0) {
                containers.push(
                    new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('## Feature Flags do Servidor\nNenhuma flag encontrada.'),
                    ),
                );
            }

            return containers;
        };

        await interaction.reply({
            components: buildContainers(),
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
        const response = await interaction.fetchReply();

        const collector = response.createMessageComponentCollector({
            time: 900_000, // 15 minutes of limit
        });

        collector.on('collect', async (itr) => {
            if (!itr.isButton() || !itr.customId.startsWith(TOGGLE_PREFIX)) return;

            const flagKey = itr.customId.slice(TOGGLE_PREFIX.length);
            const newValue = !flags[flagKey];

            try {
                await this.featureFlagsService.setFlag(guildId, flagKey, newValue);
                flags = { ...flags, [flagKey]: newValue };
                await itr.update({ components: buildContainers() });
                this.logger.log(`Flag ${flagKey} updated to ${newValue} by ${interaction.user.username}`);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Erro desconhecido';
                await itr.reply({
                    content: `❌ Erro ao atualizar a flag \`${flagKey}\`: ${message}`,
                    flags: MessageFlags.Ephemeral,
                });
            }
        });

        collector.on('end', (_collected, reason) => {
            if (reason !== 'time') return;
            interaction.editReply({ components: buildContainers(true) }).catch(() => {});
        });
    }
}
