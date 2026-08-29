import type { Role } from './role.type';

export type Member = { id: string; username: string };

export type MemberWithRoles = Member & { roles: Role[] };
