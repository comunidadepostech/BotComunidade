import type ICommand from '../../interfaces/command.interface';

export default interface ICommandProvider {
    /**
     * Register one or more Discord commands.
     *
     * @param command The command or commands to register
     */
    registerCommand(command: ICommand | ICommand[]): Promise<void>;

    /**
     * Clear all registered commands.
     */
    clearCommands(): Promise<void>;

    /**
     * Delete a specific command from a guild.
     *
     * @param commandName The name of the command to delete
     * @param guildId The guild where the command should be deleted
     */
    deleteCommand(commandName: string, guildId: string): Promise<void>;
}
