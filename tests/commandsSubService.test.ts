import { describe, expect, it, mock, beforeEach } from 'bun:test';
import CommandsSubService from '../services/discord/commandsSubService.ts';
import type { ICommand } from '../types/discord.interfaces.ts';
import type { ICommandHashRepository } from '../types/repository.interfaces.ts';
import type { CommandHashMap } from '../types/commandHash.types.ts';
import { Guild } from 'discord.js';

describe('CommandsSubService', () => {
    let service: CommandsSubService;
    let mockRepository: ICommandHashRepository;
    let mockGuilds: Guild[];
    let commandSetCalled = false;
    let lastSetCommands: ICommand[] | null = null;

    beforeEach(() => {
        commandSetCalled = false;
        lastSetCommands = null;

        // Mock para o repositório
        mockRepository = {
            getAllCommandHashes: mock(() =>
                Promise.resolve({
                    command1: 'hash_old',
                    command2: 'hash_old',
                }),
            ),
            saveCommandHashes: mock(() => Promise.resolve()),
            deleteCommandHashes: mock(() => Promise.resolve()),
            saveCommandHash: mock(() => Promise.resolve()),
            deleteCommandHash: mock(() => Promise.resolve()),
            clearAllCommandHashes: mock(() => Promise.resolve()),
        } as unknown as ICommandHashRepository;

        service = new CommandsSubService(mockRepository);

        // Mock para as guilds
        mockGuilds = [
            {
                commands: {
                    set: mock((commands: ICommand[]) => {
                        commandSetCalled = true;
                        lastSetCommands = commands;
                        return Promise.resolve();
                    }),
                },
            } as unknown as Guild,
        ];
    });

    describe('registerCommand', () => {
        it('should register all commands when no hashes are provided', async () => {
            const commands: ICommand[] = [
                {
                    build: mock(() => ({ name: 'cmd1' })),
                    execute: mock(() => Promise.resolve()),
                } as unknown as ICommand,
                {
                    build: mock(() => ({ name: 'cmd2' })),
                    execute: mock(() => Promise.resolve()),
                } as unknown as ICommand,
            ];

            await service.registerCommand(mockGuilds, commands);

            expect(commandSetCalled).toBe(true);
            expect(lastSetCommands).toHaveLength(2);
        });

        it('should filter modified commands when hashes are provided', async () => {
            const commands: ICommand[] = [
                {
                    build: mock(() => ({ name: 'command1' })),
                    execute: mock(() => Promise.resolve()),
                } as unknown as ICommand,
                {
                    build: mock(() => ({ name: 'command2' })),
                    execute: mock(() => Promise.resolve()),
                } as unknown as ICommand,
                {
                    build: mock(() => ({ name: 'new_command' })),
                    execute: mock(() => Promise.resolve()),
                } as unknown as ICommand,
            ];

            const filesystemHashes: CommandHashMap = {
                command1: 'hash_old', // unchanged
                command2: 'hash_new', // modified
                new_command: 'hash_new', // new
            };

            await service.registerCommand(mockGuilds, commands, filesystemHashes);

            // Deve registrar apenas command2 e new_command (2 modificados)
            expect(commandSetCalled).toBe(true);
            expect(lastSetCommands).toHaveLength(2);
        });

        it('should remove deleted commands', async () => {
            const commands: ICommand[] = [
                {
                    build: mock(() => ({ name: 'command1' })),
                    execute: mock(() => Promise.resolve()),
                } as unknown as ICommand,
            ];

            const filesystemHashes: CommandHashMap = {
                command1: 'hash_old',
                // command2 foi removido do filesystem
            };

            let deletedCommands: string[] = [];
            mockRepository.deleteCommandHashes = mock((names: string[]) => {
                deletedCommands = names;
                return Promise.resolve();
            });

            service = new CommandsSubService(mockRepository);

            await service.registerCommand(mockGuilds, commands, filesystemHashes);

            // Deve ter deletado command2
            expect(deletedCommands).toContain('command2');
        });

        it('should register all commands when hash comparison fails', async () => {
            // Mock de erro
            mockRepository.getAllCommandHashes = mock(() =>
                Promise.reject(new Error('DB Error')),
            );

            service = new CommandsSubService(mockRepository);

            const commands: ICommand[] = [
                {
                    build: mock(() => ({ name: 'cmd1' })),
                    execute: mock(() => Promise.resolve()),
                } as unknown as ICommand,
            ];

            const filesystemHashes: CommandHashMap = {
                cmd1: 'hash123',
            };

            await service.registerCommand(mockGuilds, commands, filesystemHashes);

            // Em caso de erro, deve registrar todos os comandos
            expect(commandSetCalled).toBe(true);
            expect(lastSetCommands).toHaveLength(1);
        });
    });

    describe('clearCommands', () => {
        it('should clear all commands from all guilds', async () => {
            await service.clearCommands(mockGuilds);

            expect(commandSetCalled).toBe(true);
            expect(lastSetCommands).toEqual([]);
        });
    });
});

