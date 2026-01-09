import CheckGuildsEvents from "./tasks/checkGuildsEvents.js";
import CountMembersByRole from "./tasks/countMemberByRole.js";
import logger from "../utils/logger.js";
import getTimeUntilNextMonth from "../utils/getTimeUntilNextMonth.js";
import safeSetTimeout from "../utils/safeTimeout.js";
import Bot from "../bot.js";
import CheckEndOfDiscordClass from "./tasks/checkEndOfDiscordClass.js";

export default class Scheduler {
    tasks: { instance: any; timeInMinutes: number; }[]
    constructor(botInstance: Bot) {
        this.tasks = [
            { instance: new CheckGuildsEvents(botInstance), timeInMinutes: Number(process.env.EVENT_CHECK_TIME) },
            { instance: new CountMembersByRole(botInstance), timeInMinutes: 0 },
            { instance: new CheckEndOfDiscordClass(botInstance), timeInMinutes: Number(process.env.EVENT_CHECK_TIME) }
        ]
    }

    async start() {
        for (const task of this.tasks) {
            if (task.timeInMinutes === 0) {
                safeSetTimeout(() => task.instance.execute().catch((error: string) => logger.error(`Erro ao executar ${task.instance.name}: ${error}`)), getTimeUntilNextMonth(task.instance.name))
            } else {
                setInterval(() => task.instance.execute().catch((error: string) => logger.error(`Erro ao executar ${task.instance.name}: ${error}`)), task.timeInMinutes * 60 * 1000);
            }
        }
    }
}
