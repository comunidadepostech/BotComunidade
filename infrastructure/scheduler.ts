import nodeCron from "node-cron";
import {SchedulerController} from "../controller/schedulerController.ts";
import {Client} from "discord.js";
import FeatureFlagsService from "../services/FeatureFlagsService.ts";

export default class Scheduler {
    static start(client: Client, featureFlagsService: FeatureFlagsService) {
        nodeCron.schedule(`* ${process.env.DISCORD_EVENTS_CHECK_TIME_IN_MINUTES} * * * *`, SchedulerController.handleEventVerification)
        nodeCron.schedule(`* * * ${process.env.DAY_OF_THE_MONTH_FOR_MEMBERS_COUNT} * *`, () => SchedulerController.handleMembersCount(client, featureFlagsService))
    }
}