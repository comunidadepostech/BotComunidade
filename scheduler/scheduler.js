import CheckGuildsEvents from "./tasks/checkGuildsEvents.js";
import CountMembersByRole from "./tasks/countMemberByRole.js";
import logger from "../utils/logger.js";
import getTimeUntilNextMonth from "../utils/getTimeUntilNextMonth.js";

export default class Scheduler {
    constructor(botInstance) {
        this.tasks = [
            {instance: new CheckGuildsEvents(botInstance), timeInMinutes: Number(process.env.EVENT_CHECK_TIME)},
            {instance: new CountMembersByRole(botInstance), timeInMinutes: 0}
        ]
    }

    async start() {
        for (const task of this.tasks) {
            if (task.timeInMinutes === 0) {
                setTimeout(() => task.instance.execute().catch((error) => logger.error(`Erro ao executar ${task.instance.name}: ${error}`)), getTimeUntilNextMonth(task.instance.name))
            } else {
                setInterval(() => task.instance.execute().catch((error) => logger.error(`Erro ao executar ${task.instance.name}: ${error}`)), task.timeInMinutes * 60 * 1000);
            }
        }
    }
}
