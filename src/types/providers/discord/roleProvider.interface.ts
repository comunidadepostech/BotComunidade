import type RoleCreationDTO from '../../dtos/roleCreation.dto';
import type { Role } from '../../role.type';

export default interface IRoleProvider {
    /**
     * Create a new role in the guild.
     *
     * @param dto Role creation data transfer object
     */
    createRole(dto: RoleCreationDTO): Promise<Role>;

    /**
     * Remove a role from the guild.
     *
     * @param guildId Id of the guild
     * @param roleId Id of the role to remove
     */
    removeRole(guildId: string, roleId: string): Promise<void>;

    /**
     * Remove one or more roles from a guild member.
     *
     * @param guildId Id of the guild
     * @param memberId Id of the member
     * @param roleIds Ids of the roles to remove from the member
     */
    removeRolesFromMember(guildId: string, memberId: string, roleIds: string[]): Promise<void>;

    /**
     * Get a role ID by its name.
     *
     * @param guildId Id of the guild
     * @param roleName The name of the role
     */
    getRoleIdByName(guildId: string, roleName: string): Promise<string>;
}
