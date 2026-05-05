import type { ICommand, IDiscordCommandsService } from '../../types/discord.interfaces.ts';
import type { ICommandHashRepository } from '../../types/repository.interfaces.ts';
import type { CommandHashMap } from '../../types/commandHash.types.ts';
import { Guild } from 'discord.js';

export default class CommandsSubService implements IDiscordCommandsService {
    constructor(private commandHashRepository?: ICommandHashRepository) {}

    async clearCommands(guilds: Guild[]): Promise<void> {
        await Promise.all(guilds.map((guild) => guild.commands.set([])));
    }

    /**
     * Registra comandos, opcionalmente filtrando por hashes
     * Se filesystemHashes for fornecido, apenas comandos modificados serão atualizados
     */
    async registerCommand(
        guilds: Guild[],
        commands: ICommand[],
        filesystemHashes?: CommandHashMap,
    ): Promise<void> {
        let commandBuilds = commands.map((cmd) => cmd.build());

        // Se temos repositório de hash e hashes do filesystem, fazer comparação incremental
        if (this.commandHashRepository && filesystemHashes) {
            const { toRegister, toDelete } = await this.getCommandsToUpdate(
                commands,
                filesystemHashes,
            );

            if (toDelete.length > 0) {
                console.log(
                    `Removing deleted commands: ${toDelete.join(', ')} (${toDelete.length} commands)`,
                );
                await this.commandHashRepository.deleteCommandHashes(toDelete);
            }

            // Filtrar comandos para registrar
            commandBuilds = toRegister.map((cmd) => cmd.build());

            console.log(
                `Registering ${commandBuilds.length}/${commands.length} commands`,
            );
        }

        await Promise.all(guilds.map((guild) => guild.commands.set(commandBuilds)));
    }

    /**
     * Determina quais comandos precisam ser atualizados
     * Retorna os comandos a registrar e os nomes de comandos a deletar
     */
    private async getCommandsToUpdate(
        commands: ICommand[],
        filesystemHashes: CommandHashMap,
    ): Promise<{ toRegister: ICommand[]; toDelete: string[] }> {
        try {
            const dbHashes = await this.commandHashRepository!.getAllCommandHashes();

            const toRegister: ICommand[] = [];
            const hashesToSave: CommandHashMap = {};
            const commandNames = new Set<string>();

            for (const cmd of commands) {
                const commandName = cmd.build().name;
                commandNames.add(commandName);

                const fileHash = filesystemHashes[commandName];
                const dbHash = dbHashes[commandName];

                // Se o comando é novo ou foi modificado
                if (!dbHash || dbHash !== fileHash) {
                    toRegister.push(cmd);
                    hashesToSave[commandName] = fileHash;
                }
            }

            // Salvar hashes dos comandos modificados/novos
            if (Object.keys(hashesToSave).length > 0) {
                await this.commandHashRepository!.saveCommandHashes(hashesToSave);
                console.log(
                    `Updated ${Object.keys(hashesToSave).length} command hash(es): ${Object.keys(hashesToSave).join(', ')}`,
                );
            }

            // Encontrar comandos deletados (existem no DB mas não no filesystem)
            const toDelete = Object.keys(dbHashes).filter(
                (name) => !commandNames.has(name),
            );

            return { toRegister, toDelete };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';
            console.warn(
                `Failed to compare command hashes, registering all commands: ${errorMessage}`,
            );
            if (errorStack) {
                console.debug(`Error details: ${errorStack}`);
            }
            // Em caso de erro, registrar todos os comandos
            return { toRegister: commands, toDelete: [] };
        }
    }
}