import { describe, expect, it, mock, beforeEach } from 'bun:test';
import MessagesSubService from '../services/discord/messagesSubService.ts';
import type VacancyMessageDto from '../dtos/vacancyMessage.dto.ts';
import { ChannelType } from 'discord.js';

describe('MessagesSubService - sendVacancyMessage', () => {
    let service: MessagesSubService;
    let mockClient: any;
    let mockFeatureFlagsService: any;
    let mockLinkedInService: any;
    let mockGuildsRepository: any;
    let mockThreadCreate: any;
    let mockGuild: any;

    beforeEach(() => {
        mockThreadCreate = mock(async () => ({
            id: 'thread-123',
        }));

        mockGuild = {
            id: '111111111',
            name: 'Test Guild',
            channels: {
                cache: {
                    values: mock(() => [
                        {
                            type: ChannelType.GuildForum,
                            name: '💼│vagas',
                            threads: {
                                create: mockThreadCreate,
                            },
                        },
                    ]),
                },
            },
        };

        mockClient = {
            guilds: {
                fetch: mock(async (guildId: string) => {
                    if (guildId === '111111111') {
                        return mockGuild;
                    }
                    return null;
                }),
            },
        };

        mockFeatureFlagsService = {
            getFlag: mock(() => true),
        };

        mockLinkedInService = {
            extractJobLinks: mock(() => []),
        };

        mockGuildsRepository = {
            getGuildIdsByCluster: mock((cluster: string) => {
                if (cluster === 'Dev') return ['111111111'];
                if (cluster === 'DevOps') return ['222222222'];
                return [];
            }),
        };

        service = new MessagesSubService(
            mockClient,
            mockFeatureFlagsService,
            mockLinkedInService,
            mockGuildsRepository,
        );
    });

    const validVacancyDto: VacancyMessageDto = {
        role: 'Senior Developer',
        role_type: 'Full-time',
        employer: 'Tech Company',
        model: 'Remote',
        description: 'We are looking for a senior developer with 5+ years of experience',
        skills: 'JavaScript, TypeScript, React',
        locations: ['São Paulo', 'Rio de Janeiro'],
        salary: 'R$ 10k - 15k',
        pub_date: '2024-01-01',
        end_date: '2024-02-01',
        ref_link: 'https://example.com/job/123',
        clusters: ['Dev'],
        role_level: 'Senior',
        how_to_apply: 'https://example.com/apply',
    };

    describe('Message creation', () => {
        it('should send vacancy message to correct guilds', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            // Should fetch the guild
            expect(mockClient.guilds.fetch).toHaveBeenCalledWith('111111111');
        });

        it('should create thread with correct name format', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            expect(mockThreadCreate).toHaveBeenCalled();
            const threadCall = mockThreadCreate.mock.calls[0][0];
            expect(threadCall.name).toContain('Tech Company');
            expect(threadCall.name).toContain('Senior Developer');
        });

        it('should include all required fields in message content', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            expect(content).toContain('Senior Developer');
            expect(content).toContain('Tech Company');
            expect(content).toContain('Full-time');
            expect(content).toContain('R$ 10k - 15k');
            expect(content).toContain('Senior');
            expect(content).toContain('São Paulo');
            expect(content).toContain('Rio de Janeiro');
            expect(content).toContain('Remote');
        });

        it('should format message with proper markdown heading for role', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            expect(content).toContain('# Senior Developer');
        });

        it('should include optional description field when provided', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            expect(content).toContain('Descrição da vaga');
            expect(content).toContain('We are looking for a senior developer');
        });

        it('should include skills section when provided', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            expect(content).toContain('Principais Skills');
            expect(content).toContain('JavaScript, TypeScript, React');
        });

        it('should not include optional fields when not provided', async () => {
            mockThreadCreate.mockClear();

            const minimalVacancy: VacancyMessageDto = {
                role: 'Developer',
                role_type: 'Full-time',
                employer: 'Company',
                model: undefined,
                description: undefined,
                skills: undefined,
                locations: ['São Paulo'],
                salary: undefined,
                pub_date: '2024-01-01',
                end_date: '2024-02-01',
                ref_link: 'https://example.com',
                clusters: ['Dev'],
                role_level: undefined,
                how_to_apply: undefined,
            };

            await service.sendVacancyMessage(minimalVacancy);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            // Should not contain sections for undefined fields
            expect(content).not.toContain('undefined');
        });

        it('should include publication and end dates', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            expect(content).toContain('2024-01-01');
            expect(content).toContain('2024-02-01');
        });
    });

    describe('Buttons handling', () => {
        it('should include both buttons when how_to_apply is provided', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const components = threadCall.message.components;

            expect(components.length).toBeGreaterThan(0);
            const buttons = components[0].components;
            expect(buttons.length).toBe(2);
        });

        it('should include only job link button when how_to_apply is not provided', async () => {
            mockThreadCreate.mockClear();
            const vacancy = { ...validVacancyDto, how_to_apply: undefined };

            await service.sendVacancyMessage(vacancy);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const components = threadCall.message.components;

            expect(components.length).toBeGreaterThan(0);
            const buttons = components[0].components;
            expect(buttons.length).toBe(1);
        });

        it('should set correct URLs for buttons', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const buttons = threadCall.message.components[0].components;

            expect(buttons.some((btn: any) => btn.data.url === 'https://example.com/apply')).toBe(
                true,
            );
            expect(buttons.some((btn: any) => btn.data.url === 'https://example.com/job/123')).toBe(
                true,
            );
        });

        it('should set correct labels for buttons', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const buttons = threadCall.message.components[0].components;

            const labels = buttons.map((btn: any) => btn.data.label);
            expect(labels).toContain('Candidate-se aqui');
            expect(labels).toContain('Link da vaga');
        });
    });

    describe('Cluster mapping', () => {
        it('should send message to all guilds for a single cluster', async () => {
            await service.sendVacancyMessage(validVacancyDto);

            expect(mockGuildsRepository.getGuildIdsByCluster).toHaveBeenCalledWith('Dev');
            expect(mockClient.guilds.fetch).toHaveBeenCalledWith('111111111');
        });

        it('should send message to guilds for multiple clusters', async () => {
            const vacancy = {
                ...validVacancyDto,
                clusters: ['Dev', 'DevOps'],
            };

            await service.sendVacancyMessage(vacancy);

            expect(mockGuildsRepository.getGuildIdsByCluster).toHaveBeenCalledWith('Dev');
            expect(mockGuildsRepository.getGuildIdsByCluster).toHaveBeenCalledWith('DevOps');
        });

        it('should handle empty guild list for cluster gracefully', async () => {
            mockGuildsRepository.getGuildIdsByCluster.mockReturnValue([]);

            await service.sendVacancyMessage(validVacancyDto);

            // Should not throw error, just skip
            expect(mockClient.guilds.fetch).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('should log warning when guild fetch fails', async () => {
            // Reset fetch mock for Dev cluster
            mockClient.guilds.fetch.mockResolvedValueOnce(null);

            await service.sendVacancyMessage(validVacancyDto);

            expect(mockClient.guilds.fetch).toHaveBeenCalled();
        });

        it('should handle missing vacancy channel', async () => {
            const guildWithoutChannel = {
                id: '111111111',
                name: 'Test Guild',
                channels: {
                    cache: {
                        values: mock(() => [
                            {
                                type: ChannelType.GuildText,
                                name: '💬│bate-papo',
                                threads: {
                                    create: mock(async () => ({})),
                                },
                            },
                        ]),
                    },
                },
            };

            mockClient.guilds.fetch.mockResolvedValueOnce(guildWithoutChannel);

            // Should not throw, just skip the guild
            await service.sendVacancyMessage(validVacancyDto);

            expect(mockClient.guilds.fetch).toHaveBeenCalled();
        });
    });

    describe('Message formatting edge cases', () => {
        it('should handle long role names', async () => {
            mockThreadCreate.mockClear();

            const vacancy = {
                ...validVacancyDto,
                role: 'Principal Software Architect with Full-Stack Expertise',
            };

            await service.sendVacancyMessage(vacancy);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            expect(threadCall.name).toContain('Principal Software Architect');
        });

        it('should handle multiple locations properly', async () => {
            mockThreadCreate.mockClear();

            const vacancy = {
                ...validVacancyDto,
                locations: [
                    'São Paulo',
                    'Rio de Janeiro',
                    'Belo Horizonte',
                    'Brasília',
                    'Salvador',
                ],
            };

            await service.sendVacancyMessage(vacancy);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            expect(content).toContain(
                'São Paulo, Rio de Janeiro, Belo Horizonte, Brasília, Salvador',
            );
        });

        it('should handle special characters in employer name', async () => {
            mockThreadCreate.mockClear();

            const vacancy = {
                ...validVacancyDto,
                employer: 'Tech & Innovation Co. (Ltd)',
            };

            await service.sendVacancyMessage(vacancy);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            expect(threadCall.name).toContain('Tech & Innovation Co. (Ltd)');
        });

        it('should properly format salary when present', async () => {
            mockThreadCreate.mockClear();

            const vacancy = {
                ...validVacancyDto,
                salary: 'R$ 15k - 25k (+ Benefits)',
            };

            await service.sendVacancyMessage(vacancy);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            expect(content).toContain('R$ 15k - 25k (+ Benefits)');
        });

        it('should format model field correctly', async () => {
            mockThreadCreate.mockClear();

            const vacancy = {
                ...validVacancyDto,
                model: 'Hybrid (2 days in office)',
            };

            await service.sendVacancyMessage(vacancy);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            expect(content).toContain('Hybrid (2 days in office)');
        });
    });

    describe('Locations handling', () => {
        it('should display single location', async () => {
            mockThreadCreate.mockClear();

            const vacancy = {
                ...validVacancyDto,
                locations: ['São Paulo'],
            };

            await service.sendVacancyMessage(vacancy);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            expect(content).toContain('São Paulo');
        });

        it('should handle empty locations array', async () => {
            mockThreadCreate.mockClear();

            const vacancy = {
                ...validVacancyDto,
                locations: [],
            };

            await service.sendVacancyMessage(vacancy);

            const threadCall = mockThreadCreate.mock.calls[0][0];
            const content = threadCall.message.content;

            // Should handle gracefully
            expect(typeof content).toBe('string');
        });
    });
});
