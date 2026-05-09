import { describe, expect, it, mock, beforeEach } from 'bun:test';
import CommandsSubService from '../services/discord/commandsSubService.ts';
import type { ICommand } from '../types/discord.interfaces.ts';
import type { ICommandHashRepository } from '../types/repository.interfaces.ts';
import type { CommandHashMap } from '../types/commandHash.types.ts';
import { Client } from 'discord.js';

describe('CommandsSubService', () => {
    let service: CommandsSubService;
    let mockRepository: ICommandHashRepository;
    let mockClient: Client;
    let commandSetCalled = false;
    let commandCreateCalled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let createdCommands: any[] = [];

    beforeEach(() => {
        commandSetCalled = false;
        commandCreateCalled = false;
        createdCommands = [];

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as ICommandHashRepository;

        service = new CommandsSubService(mockRepository);

        // Mock para o client
        mockClient = {
            application: {
                commands: {
                    set: mock(() => {
                        commandSetCalled = true;
                        return Promise.resolve();
                    }),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    create: mock((command: any) => {
                        commandCreateCalled = true;
                        createdCommands.push(command);
                        return Promise.resolve();
                    }),
                },
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as Client;
    });

    describe('registerCommands', () => {
        it('should register all commands when no hashes are provided', async () => {
            const commands: ICommand[] = [
                {
                    build: mock(() => ({ name: 'cmd1' })),
                    execute: mock((): Promise<void> => Promise.resolve()),
                } as unknown as ICommand,
                {
                    build: mock(() => ({ name: 'cmd2' })),
                    execute: mock((): Promise<void> => Promise.resolve()),
                } as unknown as ICommand,
            ];

            await service.registerCommands(mockClient, commands);

            expect(commandCreateCalled).toBe(true);
            expect(createdCommands).toHaveLength(2);
        });

        it('should filter modified commands when hashes are provided', async () => {
            const commands: ICommand[] = [
                {
                    build: mock(() => ({ name: 'command1' })),
                    execute: mock((): Promise<void> => Promise.resolve()),
                } as unknown as ICommand,
                {
                    build: mock(() => ({ name: 'command2' })),
                    execute: mock((): Promise<void> => Promise.resolve()),
                } as unknown as ICommand,
                {
                    build: mock(() => ({ name: 'new_command' })),
                    execute: mock((): Promise<void> => Promise.resolve()),
                } as unknown as ICommand,
            ];

            const filesystemHashes: CommandHashMap = {
                command1: 'hash_old', // unchanged
                command2: 'hash_new', // modified
                new_command: 'hash_new', // new
            };

            await service.registerCommands(mockClient, commands, filesystemHashes);

            // Deve registrar apenas command2 e new_command (2 modificados)
            expect(commandCreateCalled).toBe(true);
            expect(createdCommands).toHaveLength(2);
        });

        it('should remove deleted commands', async () => {
            const commands: ICommand[] = [
                {
                    build: mock(() => ({ name: 'command1' })),
                    execute: mock((): Promise<void> => Promise.resolve()),
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

            await service.registerCommands(mockClient, commands, filesystemHashes);

            // Deve ter deletado command2
            expect(deletedCommands).toContain('command2');
        });

        it('should register all commands when hash comparison fails', async () => {
            // Mock de erro
            mockRepository.getAllCommandHashes = mock(() => Promise.reject(new Error('DB Error')));

            service = new CommandsSubService(mockRepository);

            const commands: ICommand[] = [
                {
                    build: mock(() => ({ name: 'cmd1' })),
                    execute: mock((): Promise<void> => Promise.resolve()),
                } as unknown as ICommand,
            ];

            const filesystemHashes: CommandHashMap = {
                cmd1: 'hash123',
            };

            await service.registerCommands(mockClient, commands, filesystemHashes);

            // Em caso de erro, deve registrar todos os comandos
            expect(commandCreateCalled).toBe(true);
            expect(createdCommands).toHaveLength(1);
        });
    });

    describe('clearCommands', () => {
        it('should clear all commands from the application', async () => {
            await service.clearCommands(mockClient);

            expect(commandSetCalled).toBe(true);
        });
    });
});
