import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { WebhookController } from '../controller/webhookController.ts';
import { ChannelType } from 'discord.js';

// Mock environment variables
mock.module('../config/env.ts', () => ({
    env: {
        WEBHOOK_TOKEN: 'valid-token',
    },
}));

describe('WebhookController', () => {
    let controller: WebhookController;
    let mockClient: any;
    let mockFeatureFlagsService: any;
    let mockDiscordService: any;
    let mockGuildsRepository: any;

    beforeEach(() => {
        const mockGuild = {
            id: 'guild-123',
            name: 'Test Guild',
            roles: {
                cache: {
                    find: mock(() => ({
                        id: 'role-123',
                        name: 'Estudantes T1',
                        toString: () => '<@&role-123>',
                    })),
                },
            },
            channels: {
                cache: {
                    get: mock((id: string) => {
                        if (id === 'parent-123') return { name: 'T1' };
                        return null;
                    }),
                    find: mock(() => ({
                        id: 'chan-123',
                        name: 'Channel T1',
                        type: ChannelType.GuildVoice,
                        isTextBased: () => true,
                        parent: { name: 'T1' },
                    })),
                    filter: mock((fn: any) => {
                        const channels = [
                            {
                                id: 'chat-123',
                                name: '💬│bate-papo',
                                isTextBased: () => true,
                                parentId: 'parent-123',
                                type: ChannelType.GuildText,
                            },
                        ];
                        const filtered = channels.filter(fn);
                        return {
                            values: () => filtered,
                        };
                    }),
                },
            },
        };

        mockClient = {
            guilds: {
                fetch: mock(() => Promise.resolve(mockGuild)),
                cache: {
                    get: mock(() => mockGuild),
                },
            },
        };

        mockFeatureFlagsService = {
            getFlag: mock(() => true),
        };

        mockDiscordService = {
            events: {
                create: mock(() => Promise.resolve()),
            },
            messages: {
                sendLivestreamPoll: mock(() => Promise.resolve()),
                sendWarning: mock(() => Promise.resolve()),
            },
        };

        mockGuildsRepository = {
            getGuildIdByCourse: mock(() => 'guild-123'),
        };

        controller = new WebhookController({
            client: mockClient,
            featureFlagsService: mockFeatureFlagsService,
            discordService: mockDiscordService,
            guildsRepository: mockGuildsRepository,
        });
    });

    describe('EventManagement', () => {
        const createRequest = (body: any, token = 'valid-token') => {
            return {
                json: async () => body,
                headers: {
                    get: (name: string) => (name === 'token' ? token : null),
                },
            } as unknown as Request;
        };

        it('should create an event successfully', async () => {
            const body = {
                nomeEvento: 'Aula 1',
                data_hora: new Date(Date.now() + 100000).toISOString(),
                fim: new Date(Date.now() + 200000).toISOString(),
                turma: 'T1',
                link: 'https://test.com',
                tipo: 'Live',
            };

            const response = await controller.EventManagement(createRequest(body));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.status).toBe('success');
            expect(mockDiscordService.events.create).toHaveBeenCalled();
        });

        it('should return 401 if token is invalid', async () => {
            const response = await controller.EventManagement(createRequest({}, 'wrong-token'));
            expect(response.status).toBe(401);
        });

        it('should return 400 if validation fails', async () => {
            const body = {
                nomeEvento: '', // Invalid
                turma: 'T1',
            };
            const response = await controller.EventManagement(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 404 if guild is not found', async () => {
            mockGuildsRepository.getGuildIdByCourse.mockReturnValue(null);
            const body = {
                nomeEvento: 'Aula 1',
                data_hora: new Date(Date.now() + 100000).toISOString(),
                fim: new Date(Date.now() + 200000).toISOString(),
                turma: 'T1',
                link: 'https://test.com',
                tipo: 'Live',
            };

            const response = await controller.EventManagement(createRequest(body));
            expect(response.status).toBe(404);
        });
    });

    describe('SendLivePoll', () => {
        const createRequest = (body: any, token = 'valid-token') => {
            return {
                json: async () => body,
                headers: {
                    get: (name: string) => (name === 'token' ? token : null),
                },
            } as unknown as Request;
        };

        it('should send a live poll successfully', async () => {
            const body = { evento: 'T1 - Aula 1' };
            const response = await controller.SendLivePoll(createRequest(body));

            expect(response.status).toBe(200);
            expect(mockDiscordService.messages.sendLivestreamPoll).toHaveBeenCalled();
        });

        it('should return 200 but not send poll if feature flag is disabled', async () => {
            mockFeatureFlagsService.getFlag.mockReturnValue(false);
            const body = { evento: 'T1 - Aula 1' };
            const response = await controller.SendLivePoll(createRequest(body));

            expect(response.status).toBe(200);
            expect(mockDiscordService.messages.sendLivestreamPoll).not.toHaveBeenCalled();
        });
    });

    describe('sendWarning', () => {
        const createRequest = (body: any, token = 'valid-token') => {
            return {
                json: async () => body,
                headers: {
                    get: (name: string) => (name === 'token' ? token : null),
                },
            } as unknown as Request;
        };

        it('should send a warning successfully', async () => {
            const body = { mensagem: 'Atenção', turma: 'T1' };
            const response = await controller.sendWarning(createRequest(body));

            expect(response.status).toBe(200);
            expect(mockDiscordService.messages.sendWarning).toHaveBeenCalled();
        });

        it('should return 404 if warning channel is not found', async () => {
            // Override the channel find mock for this test
            const mockGuild = await mockClient.guilds.fetch();
            mockGuild.channels.cache.find = mock(() => null);

            const body = { mensagem: 'Atenção', turma: 'T1' };
            const response = await controller.sendWarning(createRequest(body));
            expect(response.status).toBe(404);
        });
    });
});
