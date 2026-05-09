import { describe, expect, it, mock, beforeEach } from 'bun:test';
import DiscordService from '../services/discordService.ts';
import type {
    IDiscordEventService,
    IDiscordMessageService,
    IDiscordRoleService,
    IDiscordClassService,
    IDiscordCommandsService,
} from '../types/discord.interfaces.ts';
import type { Client } from 'discord.js';

/**
 * DiscordService Facade Tests
 *
 * These tests verify that the DiscordService correctly aggregates and exposes
 * its sub-services, and that calls to those sub-services behave as expected.
 */
describe('DiscordService Facade', () => {
    let mockEvents: IDiscordEventService;
    let mockMessages: IDiscordMessageService;
    let mockRoles: IDiscordRoleService;
    let mockClass: IDiscordClassService;
    let mockCommands: IDiscordCommandsService;
    let service: DiscordService;

    beforeEach(() => {
        // Initialize mock sub-services with mock functions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockEvents = {
            create: mock(() => Promise.resolve()),
            delete: mock(() => Promise.resolve()),
        } as any as IDiscordEventService;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockMessages = {
            broadcast: mock(() => Promise.resolve()),
            sendWarning: mock(() => Promise.resolve()),
            sendLivestreamPoll: mock(() => Promise.resolve()),
            sendWelcomeMessage: mock(() => Promise.resolve()),
            createPoll: mock(() => Promise.resolve()),
        } as any as IDiscordMessageService;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockRoles = {
            delete: mock(() => Promise.resolve()),
            removeFromUser: mock(() => Promise.resolve()),
        } as any as IDiscordRoleService;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockClass = {
            create: mock(() => Promise.resolve({ role: {} as unknown, message: 'created' })),
            disable: mock((): Promise<void> => Promise.resolve()),
        } as any as IDiscordClassService;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockCommands = {
            clearCommands: mock(() => Promise.resolve()),
            registerCommands: mock(() => Promise.resolve()),
        } as any as IDiscordCommandsService;

        // Instantiate the service with injected mocks
        service = new DiscordService(mockEvents, mockMessages, mockRoles, mockClass, mockCommands);
    });

    it('should correctly expose the injected sub-services as properties', () => {
        expect(service.events).toBe(mockEvents);
        expect(service.messages).toBe(mockMessages);
        expect(service.roles).toBe(mockRoles);
        expect(service.class).toBe(mockClass);
        expect(service.commands).toBe(mockCommands);
    });

    describe('Behavioral Assertions', () => {
        it('should correctly delegate calls to the events sub-service', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dto = { topic: 'New Workshop', guildId: '123' } as any;
            await service.events.create(dto);

            expect(mockEvents.create).toHaveBeenCalledTimes(1);
            expect(mockEvents.create).toHaveBeenCalledWith(dto);
        });

        it('should correctly delegate calls to the messages sub-service', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dto = { message: 'Alert!', role: 'Student' } as any;
            await service.messages.sendWarning(dto);

            expect(mockMessages.sendWarning).toHaveBeenCalledTimes(1);
            expect(mockMessages.sendWarning).toHaveBeenCalledWith(dto);
        });

        it('should propagate errors from sub-services to the caller', async () => {
            const error = new Error('Discord API Error');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (mockRoles.delete as any).mockImplementationOnce(() => Promise.reject(error));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(service.roles.delete({} as any)).rejects.toThrow('Discord API Error');
        });

        it('should return complex values from sub-services correctly', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const expectedResult = {
                role: { id: 'role-1' } as any,
                message: 'Class successfully created',
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (mockClass.create as any).mockImplementationOnce(() => Promise.resolve(expectedResult));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await service.class.create({} as any);

            expect(result).toEqual(expectedResult);
            expect(mockClass.create).toHaveBeenCalled();
        });

        it('should allow chaining or multiple calls to different sub-services', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mockClient = {} as any;
            await service.commands.clearCommands(mockClient as Client);
            await service.events.delete('guild-1', 'event-1');

            expect(mockCommands.clearCommands).toHaveBeenCalled();
            expect(mockEvents.delete).toHaveBeenCalledWith('guild-1', 'event-1');
        });
    });
});
