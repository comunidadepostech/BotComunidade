var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import CheckGuildsEvents from "./tasks/checkGuildsEvents.js";
import CountMembersByRole from "./tasks/countMemberByRole.js";
import logger from "../utils/logger.js";
import getTimeUntilNextMonth from "../utils/getTimeUntilNextMonth.js";
export default class Scheduler {
    constructor(botInstance) {
        this.tasks = [
            { instance: new CheckGuildsEvents(botInstance), timeInMinutes: Number(process.env.EVENT_CHECK_TIME) },
            { instance: new CountMembersByRole(botInstance), timeInMinutes: 0 }
        ];
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const task of this.tasks) {
                if (task.timeInMinutes === 0) {
                    setTimeout(() => task.instance.execute().catch((error) => logger.error(`Erro ao executar ${task.instance.name}: ${error}`)), getTimeUntilNextMonth(task.instance.name));
                }
                else {
                    setInterval(() => task.instance.execute().catch((error) => logger.error(`Erro ao executar ${task.instance.name}: ${error}`)), task.timeInMinutes * 60 * 1000);
                }
            }
        });
    }
}
