import logger from "./logger.js";

export default function getTimeUntilNextMonth(taskName) {
    const now = new Date();
    const nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, Number(process.env.DAY_FOR_MONTH_TASKS));
    nextFirst.setHours(0, 0, 0, 0);
    logger.debug(`${taskName} agendado para ${nextFirst}`)
    return nextFirst.getTime() - now.getTime();
}