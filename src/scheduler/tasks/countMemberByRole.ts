import logger from "../../utils/logger.js";
import getTimeUntilNextMonth from "../../utils/getTimeUntilNextMonth.js";
import { Bot } from "../../bot.js";
import { Guild } from "discord.js";

export default class CountMembersByRole {
    bot: Bot
    name: string

    constructor(bot: Bot) {
        this.bot = bot
        this.name = import.meta.url.split('/').pop()!.replace('.js', '')
    }

    async #getMembersByRole(guild: Guild) {
        const roles = await guild.roles.fetch();
        const members = await guild.members.fetch();

        interface RoleCount {
            roleName: string;
            count: number;
        }

        const roleCounts: RoleCount[] = []

        roles.forEach(role => {
            if (role.name) roleCounts.push({roleName: role.name, count: members.filter(member => member.roles.cache.has(role.id)).size});
        });

        return roleCounts;
    }

    async execute() {
        interface RoleCount {
            roleName: string;
            count: number;
        }

        interface Payload {
            guildName: string;
            data: RoleCount[]
        }
        
        let payload: Payload[] = []

        for (const guild of this.bot.client.guilds.cache.values()) {
            if (this.bot.flags[guild.id]['saveMembers'] === false) continue;
            payload.push({guildName: guild.name, data: await this.#getMembersByRole(guild)}) 
        }

        const res = await fetch(`${process.env.N8N_ENDPOINT}/salvarMembros`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': process.env.N8N_TOKEN as string
            },
            body: JSON.stringify(payload)
        })

        logger.debug(JSON.stringify(payload))

        if (!res.ok) {
            logger.error(`Erro ao enviar dados para o n8n: ${res.status} - ${res.statusText} - ${res.url}`)
        }

        setTimeout(() => this.execute().catch((error) => logger.error(`Erro ao executar ${this.name}: ${error}`)), getTimeUntilNextMonth(this.name))
    }
}