import type IRoleProvider from "../types/providers/discord/roleProvider.interface";
import type IRoleService from "../types/services/roleService.interface";

export default class RoleService implements IRoleService {
    constructor(private roleProvider: IRoleProvider) {}

    async getRoleIdByName(guildId: string, name: string): Promise<string> {
        return await this.roleProvider.getRoleIdByName(guildId, name);
    }
}