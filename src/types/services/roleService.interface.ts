import type { MemberWithRoles } from '../member.type';
import type { Role } from '../role.type';

export default interface IRoleService {
    /**
     * Retrieve the ID of a role by its name in a guild.
     *
     * @param guildId The guild ID
     * @param name The role name
     */
    getRoleIdByName(guildId: string, name: string): Promise<string>;

    /**
     * Remove the student roles of every member that has more than one of them in a guild.
     *
     * @param guildId The guild ID
     * @returns The members that had their student roles removed, with the removed roles
     */
    removeDuplicatedStudentRoles(guildId: string): Promise<{ member: MemberWithRoles; removedRoles: Role[] }[]>;
}
