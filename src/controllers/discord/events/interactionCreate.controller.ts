import { MessageFlags, type BaseInteraction } from 'discord.js';
import type IController from '../../../types/interfaces/controller.interface.ts';
import type ICommand from '../../../types/interfaces/command.interface.ts';
import type ILoggerService from '../../../types/services/loggerService.interface.ts';
import { AppError } from '../../../types/errors.types.ts';

interface ICommandController extends ICommand, IController {}

export default class InteractionCreateEventController implements IController {
    private commands: Record<string, ICommandController> = {};
    constructor(
        commands: ICommandController[],
        private logger: ILoggerService,
    ) {
        this.commands = commands.reduce(
            (acc, cmd) => {
                acc[cmd.build().name] = cmd;
                return acc;
            },
            {} as Record<string, ICommandController>,
        );
    }

    async handle(interaction: BaseInteraction): Promise<void> {
        if (!interaction.isCommand() && !interaction.isContextMenuCommand()) return;

        const command = this.commands[interaction.commandName];
        if (!command) return;

        this.logger.log(`'${interaction.commandName}' command executed by ${interaction.user.username}`);

        try {
            await command.handle(interaction);
        } catch (error) {
            const errorMessage =
                `Erro inesperando ao executar ${interaction.commandName}, reporte esse erro.\n` +
                '```' +
                error +
                '```';

            if (error instanceof AppError) {
                this.logger.error(error.message, { stacktrace: error.stack });
                if (!interaction.isRepliable()) return;

                if (interaction.deferred) {
                    await interaction.editReply({
                        content: errorMessage,
                    });
                    return;
                }

                await interaction.reply({
                    content: errorMessage,
                    flags: [MessageFlags.Ephemeral],
                });
            } else {
                throw error;
            }
        }
    }
}
