import {Events} from "discord.js";

export class GuildCreate {
    constructor(bot){
        this.name = Events.GuildCreate; // O nome do evento
        this.once = false;
        this.bot = bot
    }

    async execute(guild){
        console.info(`LOG - ${this.bot.client.user.username} adicionado ao servidor ${guild.name} com ID ${guild.id}`);

        this.bot.flags[guild.id] = this.bot.defaultFlags
        await this.bot.db.getFlags(guild.id)
        console.log(`LOG - Flags do servidor ${guild.name} carregadas`);
    }
}