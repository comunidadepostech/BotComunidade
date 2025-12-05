import {Events, Guild} from "discord.js";
import logger from "../../utils/logger.js";
import Bot from "../../bot.js";

export default class GuildCreate {
    name: string;
    once: boolean;
    bot: Bot;
    constructor(bot: Bot){
        this.name = Events.GuildCreate;
        this.once = false;
        this.bot = bot
    }

    async execute(guild: Guild): Promise<void>{
        logger.log(`${this.bot.client.user?.username} adicionado ao servidor ${guild.name} com ID ${guild.id}`);

        this.bot.flags[guild.id] = this.bot.defaultFlags || {}
        await this.bot.db.getFlags(guild.id)
        logger.log(`Flags do servidor ${guild.name} carregadas`);
    }
}