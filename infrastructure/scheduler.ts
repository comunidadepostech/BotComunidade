import nodeCron from 'node-cron';
import type ISchedulerService from '../types/schedulerService.interface.ts';
import { env } from '../config/env.ts';

export default class Scheduler {
    private static timezone = { timezone: 'America/Sao_Paulo' };

    static start(schedulerService: ISchedulerService): void {
        nodeCron.schedule(
            `*/${env.DISCORD_EVENTS_CHECK_TIME_IN_MINUTES} * * * *`,
            async () => await schedulerService.handleEventVerification(),
            Scheduler.timezone,
        );
        nodeCron.schedule(
            `0 0 ${env.DAY_OF_THE_MONTH_FOR_MEMBERS_COUNT} * *`,
            async () => await schedulerService.handleMembersCount(),
            Scheduler.timezone,
        );
        nodeCron.schedule(
            `0 ${env.HOUR_OF_THE_DAY_TO_CLEAR_WARNING_MESSAGES} * * *`,
            async () => await schedulerService.handleEventWarningMessagesDelete(),
            Scheduler.timezone,
        );
        nodeCron.schedule(
            `*/${env.EVENTS_CACHE_CLEAR_TIME_IN_MINUTES} * * * *`,
            async () => await schedulerService.handleEventCacheClear(),
            Scheduler.timezone,
        );
        nodeCron.schedule(
            `*/${env.ONLINE_MEMBERS_COUNT_DELAY_IN_MINUTES} * * * *`,
            async () => await schedulerService.handleOnlineMembersCount(),
            Scheduler.timezone,
        );
    }
}
