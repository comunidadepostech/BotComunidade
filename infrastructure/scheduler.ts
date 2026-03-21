import nodeCron from "node-cron";
import {SchedulerService} from "../services/schedulerService.ts";
import {env} from "../config/env.ts";

export default class Scheduler {
    static start(schedulerService: SchedulerService) {
        nodeCron.schedule(`*/${env.DISCORD_EVENTS_CHECK_TIME_IN_MINUTES} * * * *`, async () => await schedulerService.handleEventVerification())
        nodeCron.schedule(`0 0 ${env.DAY_OF_THE_MONTH_FOR_MEMBERS_COUNT} * *`, async () => await schedulerService.handleMembersCount())
    }
}