import {Collection, Guild, GuildMember, Role} from "discord.js";

export default class RolesService {
    static async getMembersByRole(guild: Guild): Promise<{roleName: string, count: number}[]> {
        const roles: Collection<string, Role> = await guild.roles.fetch();
        const members: Collection<string, GuildMember> = await guild.members.fetch();

        const roleCounts: {roleName: string, count: number}[] = []

        roles.forEach(role => {
            if (role.name) roleCounts.push({roleName: role.name, count: members.filter(member => member.roles.cache.has(role.id)).size});
        });

        return roleCounts;
    }
}

