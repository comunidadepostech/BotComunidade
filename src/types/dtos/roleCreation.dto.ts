export default interface RoleCreationDTO {
    guildId: string;
    roleName: string;
    color: number;
    hoist: boolean;
    mentionable: boolean;
    permissions: any; // Can't rewrite PermissionResolvable by hand
}
