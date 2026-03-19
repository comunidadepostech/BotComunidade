import {IDiscordRoleService} from "../../types/discord.interfaces.ts";
import {GuildMember, Role} from "discord.js";

export default class RolesSubService implements IDiscordRoleService {
    constructor(){}

    async delete(role: Role): Promise<void | Error> {
        await role.delete()
    }
    async removeFromUser(user: GuildMember, roleId: string): Promise<void | Error> {
        await user.roles.remove(roleId)
    }
}