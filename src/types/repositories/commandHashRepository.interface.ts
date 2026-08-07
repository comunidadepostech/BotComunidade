export default interface ICommandHashRepository {
    /**
     * Retrieve all stored command hashes.
     *
     * @returns Array of command names and file hashes
     */
    // Return a map of command names to their corresponding hashes
    getAllCommands(): Promise<
        {
            command_name: string;
            file_hash: string;
        }[]
    >;

    /**
     * Save or overwrite a command hash.
     *
     * @param commandName The name of the command
     * @param hash The file hash to save
     */
    // If the command hash exists, overwrite it for a specific command name
    saveCommand(commandName: string, hash: string): Promise<void>;

    /**
     * Delete one or more command hashes.
     *
     * @param commandName The command name or names to delete
     */
    deleteCommand(commandName: string | string[]): Promise<void>;

    /**
     * Remove all stored command hashes.
     */
    clearAllCommands(): Promise<void>;

    /**
     * Update an existing command hash or create a new one.
     *
     * @param commandName The name of the command
     * @param hash The new hash value
     */
    // If the command hash exists, update it for a specific command name otherwise create a new entry
    updateCommand(commandName: string, hash: string): Promise<void>;

    /**
     * Get the stored hash for a specific command.
     *
     * @param commandName The name of the command
     */
    getCommandByName(commandName: string): Promise<{ command_name: string; file_hash: string } | null>;
}
