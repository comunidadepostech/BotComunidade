import logger from "./logger.ts";

export default function getTimeUntilNextMonth(taskName: string) {
    const now = new Date();
    const nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, Number(process.env.DAY_FOR_MONTH_TASKS));
    nextFirst.setHours(0, 0, 0, 0);
    logger.debug(`${taskName} agendado para ${nextFirst}`)
    return nextFirst.getTime() - now.getTime();
}