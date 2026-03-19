import nodeCron from "node-cron";
import {SchedulerService} from "../services/schedulerService.ts";
import {Client} from "discord.js";
import FeatureFlagsService from "../services/featureFlagsService.ts";

export default class Scheduler {
    static start(schedulerService: SchedulerService) {
        nodeCron.schedule(`*/${process.env.DISCORD_EVENTS_CHECK_TIME_IN_MINUTES} * * * *`, async () => await schedulerService.handleEventVerification())
        nodeCron.schedule(`0 0 ${process.env.DAY_OF_THE_MONTH_FOR_MEMBERS_COUNT} * *`, async () => await schedulerService.handleMembersCount())
    }
}