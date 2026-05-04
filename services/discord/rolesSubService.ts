import type {IDiscordRoleService} from "../../types/discord.interfaces.ts";
import {GuildMember, Role} from "discord.js";

export default class RolesSubService implements IDiscordRoleService {
    constructor(){}

    async delete(role: Role): Promise<void> {
        await role.delete()
    }
    async removeFromUser(user: GuildMember, roleId: string): Promise<void> {
        await user.roles.remove(roleId)
    }
}