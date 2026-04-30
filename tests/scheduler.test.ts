import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { GuildScheduledEventStatus, PresenceUpdateStatus } from 'discord.js';
import NotificationDispatcherService from '../services/scheduler/notificationDispatcherService.ts';
import EventProcessorService from '../services/scheduler/eventProcessorService.ts';
import MetricCollectorService from '../services/scheduler/metricCollectorService.ts';
import CleanupManagerService from '../services/scheduler/cleanupManagerService.ts';

/**
 * Modular Scheduler Services Tests
 *
 * This suite verifies the behavior of the refactored scheduler components,
 * ensuring each sub-service handles its specific responsibility correctly.
 */

// Mock Environment configuration
mock.module('../config/env.ts', () => ({
    env: {
        REMAINING_EVENT_TIME_FOR_WARNING_IN_MINUTES: 30,
        MAX_STUDY_GROUP_NOTIFICATION_DURATION_IN_HOURS: 2,
    },
}));

describe('Modular Scheduler Services', () => {
    let mockWarningRepo: any;
    let mockFeatureFlags: any;
    let mockN8n: any;
    let mockClient: any;
    let eventsCache: Map<string, any>;

    beforeEach(() => {
        // Shared mock dependencies
        mockWarningRepo = {
            save: mock(() => Promise.resolve()),
            check: mock(() => Promise.resolve(false)),
            delete: mock(() => Promise.resolve()),
        };
        mockFeatureFlags = {
            isEnabled: mock(() => true),
            getFlag: mock(() => true),
        };
        mockN8n = {
            saveRolesMembersCount: mock(() => Promise.resolve()),
            saveOnlineMembers: mock(() => Promise.resolve()),
        };
        mockClient = {
            guilds: {
                cache: new Map(),
                fetch: mock(),
            },
            channels: {
                fetch: mock(),
            },
        };
        eventsCache = new Map();
    });

    describe('NotificationDispatcherService', () => {
        it('should format message correctly and record it in repository', async () => {
            const service = new NotificationDispatcherService(mockWarningRepo);
            const mockChannel = {
                send: mock(() => Promise.resolve({ id: 'msg-123', channelId: 'chan-456' })),
            } as any;
            const mockRole = { toString: () => '<@&role-id>' } as any;

            const startTimestamp = new Date('2024-01-01T20:00:00Z').getTime();

            await service.dispatchWarning(
                mockRole,
                'https://discord.com/events/1/2',
                startTimestamp,
                mockChannel,
            );

            expect(mockChannel.send).toHaveBeenCalledWith(
                expect.stringContaining('Boa noite, turma!!'),
            );
            expect(mockChannel.send).toHaveBeenCalledWith(expect.stringContaining('<@&role-id>'));
            expect(mockWarningRepo.save).toHaveBeenCalledWith('msg-123', 'chan-456');
        });
    });

    describe('EventProcessorService', () => {
        let mockDispatcher: any;
        let service: EventProcessorService;

        beforeEach(() => {
            mockDispatcher = { dispatchWarning: mock(() => Promise.resolve()) };
            service = new EventProcessorService(
                mockFeatureFlags,
                mockDispatcher,
                mockWarningRepo,
                eventsCache,
            );
        });

        it('should remove completed events from cache', async () => {
            const mockEvent = {
                id: 'event-1',
                status: GuildScheduledEventStatus.Completed,
            } as any;
            eventsCache.set('event-1', { notified: true });

            await service.process(mockEvent);

            expect(eventsCache.has('event-1')).toBe(false);
        });

        it('should skip processing if event name format is invalid', async () => {
            const mockEvent = {
                id: 'event-1',
                name: 'InvalidEventName',
                status: GuildScheduledEventStatus.Scheduled,
            } as any;

            await service.process(mockEvent);
            expect(eventsCache.has('event-1')).toBe(false);
        });

        it('should dispatch notification when event is within warning window', async () => {
            const now = Date.now();
            const startTs = now + 15 * 60 * 1000; // 15 mins from now

            const mockEvent = {
                id: 'event-1',
                name: 'T1 - Mentoria Especial',
                status: GuildScheduledEventStatus.Scheduled,
                scheduledStartTimestamp: startTs,
                guildId: 'guild-1',
                guild: {
                    roles: { cache: { find: mock(() => ({ id: 'r1' })) } },
                    channels: {
                        cache: {
                            filter: mock(() => ({
                                find: mock(() => ({ id: 'target-chan' })),
                                values: mock(() => []),
                            })),
                            get: mock(() => ({ parentId: 'p1' })),
                        },
                    },
                },
            } as any;

            await service.process(mockEvent);

            expect(eventsCache.get('event-1')?.notified).toBe(true);
        });

        it('should auto-start study groups when start time is reached', async () => {
            const now = Date.now();
            const startTs = now - 1000; // Time reached

            const mockEvent = {
                id: 'event-1',
                name: 'T1 - Grupo de Estudos',
                status: GuildScheduledEventStatus.Scheduled,
                scheduledStartTimestamp: startTs,
                guildId: 'guild-1',
                channelId: 'chan-1',
                setStatus: mock(() => Promise.resolve()),
            } as any;

            await service.process(mockEvent);

            expect(mockEvent.setStatus).toHaveBeenCalledWith(GuildScheduledEventStatus.Active);
        });
    });

    describe('MetricCollectorService', () => {
        it('should collect and send online presence metrics', async () => {
            const service = new MetricCollectorService(mockClient, mockFeatureFlags, mockN8n);

            const membersList = [
                { presence: { status: PresenceUpdateStatus.Online } },
                { presence: { status: PresenceUpdateStatus.DoNotDisturb } },
                { presence: null },
            ];

            const mockGuild = {
                id: 'g1',
                members: {
                    fetch: mock(() =>
                        Promise.resolve({
                            filter: (cb: any) => ({
                                size: membersList.filter(cb).length,
                            }),
                        }),
                    ),
                },
            };

            mockClient.guilds.cache.set('g1', mockGuild);

            await service.collectOnlinePresence();

            expect(mockN8n.saveOnlineMembers).toHaveBeenCalledWith(2);
        });
    });

    describe('CleanupManagerService', () => {
        it('should delete expired warning messages and clear repository', async () => {
            const service = new CleanupManagerService(mockClient, mockWarningRepo, eventsCache);

            const mockMessage = {
                deletable: true,
                delete: mock(() => Promise.resolve()),
            };

            const mockChannel = {
                isTextBased: () => true,
                messages: {
                    fetch: mock(() => Promise.resolve(mockMessage)),
                    delete: mock(() => Promise.resolve()),
                },
            };

            mockWarningRepo.check.mockReturnValue(
                Promise.resolve([{ message_id: 'm1', channel_id: 'c1' }]),
            );
            mockClient.channels.fetch.mockReturnValue(Promise.resolve(mockChannel));

            await service.cleanupWarningMessages();

            expect(mockChannel.messages.delete).toHaveBeenCalledWith('m1');
            expect(mockWarningRepo.delete).toHaveBeenCalled();
        });

        it('should clear expired events from memory cache', async () => {
            const service = new CleanupManagerService(mockClient, mockWarningRepo, eventsCache);

            eventsCache.set('evt-old', { guildID: 'g1' });

            const mockGuild = {
                scheduledEvents: {
                    cache: {
                        has: mock((_id) => false), // Event no longer in Discord
                    },
                },
            };

            mockClient.guilds.fetch.mockReturnValue(Promise.resolve(mockGuild));

            await service.clearExpiredCache();

            expect(eventsCache.has('evt-old')).toBe(false);
        });
    });
});
