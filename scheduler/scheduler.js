import CheckGuildsEvents from "./tasks/checkGuildsEvents.js";

export default class Scheduler {
    constructor(botInstance) {
        this.tasks = [
            {instance: new CheckGuildsEvents(botInstance), timeInMinutes: Number(process.env.EVENT_CHECK_TIME)}
        ];
    }

    async start() {
        for (const task of this.tasks) {
            task.instance.execute().catch((error) => console.log(`Erro ao executar ${task.instance.name}: ${error}`)) // Executa cada uma das tasks uma vez para acelerar o debug (pode ser desativado)
            setInterval(() => task.instance.execute().catch((error) => console.log(`Erro ao executar ${task.instance.name}: ${error}`)), task.timeInMinutes * 60 * 1000);
        }
    }
}
