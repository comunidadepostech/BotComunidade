import {GuildMember, Role} from "discord.js"

export default class ClassService {
    public static async create() {

    }

    public static async disable(members: GuildMember[], role: Role) {
        for (const member of members) {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
            }
        }
    }
}