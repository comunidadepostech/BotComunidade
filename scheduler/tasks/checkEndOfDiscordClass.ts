import Bot from "../../bot.js";

export default class CheckEndOfDiscordClass {
    bot: Bot
    events: Map<string, boolean>
    maxCacheSize: number
    name: string
    constructor(bot: Bot) {
        this.events = new Map()
        this.maxCacheSize = Number(process.env.MAX_EVENTS_CACHE);
        this.bot = bot
        this.name = import.meta.url.split('/').pop()!.replace('.js', '')
    }

    async execute() {

    }
}
