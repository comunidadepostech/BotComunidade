import type { MemberWithRoles } from '../types/member.type';
import type IMemberProvider from '../types/providers/discord/memberProvider.interface';
import type IRoleProvider from '../types/providers/discord/roleProvider.interface';
import type { Role } from '../types/role.type';
import type IRoleService from '../types/services/roleService.interface';
import { STUDENT_ROLE_NAME_PREFIX } from '../utils/constants/discordConstants';

export default class RoleService implements IRoleService {
    constructor(
        private roleProvider: IRoleProvider,
        private memberProvider: IMemberProvider,
    ) {}

    async getRoleIdByName(guildId: string, name: string): Promise<string> {
        return await this.roleProvider.getRoleIdByName(guildId, name);
    }

    async removeDuplicatedStudentRoles(guildId: string): Promise<{ member: MemberWithRoles; removedRoles: Role[] }[]> {
        const members = await this.memberProvider.listMembersWithRoles(guildId);

        const removals: { member: MemberWithRoles; removedRoles: Role[] }[] = [];

        for (const member of members) {
            const studentRoles = member.roles.filter((role) => role.name.startsWith(STUDENT_ROLE_NAME_PREFIX));

            if (studentRoles.length < 2) continue;

            await this.roleProvider.removeRolesFromMember(
                guildId,
                member.id,
                studentRoles.map((role) => role.id),
            );

            removals.push({ member, removedRoles: studentRoles });
        }

        return removals;
    }
}
