import type { Client } from 'discord.js';
import type IController from '../../types/interfaces/controller.interface';
import type ILoggerService from '../../types/services/loggerService.interface';
import type IRoleService from '../../types/services/roleService.interface';
import type IFeatureFlagsService from '../../types/services/featureFlagsService.interface';

export default class DuplicatedStudentRolesController implements IController {
    constructor(
        private logger: ILoggerService,
        private roleService: IRoleService,
        private client: Client,
        private flagsService: IFeatureFlagsService,
    ) {}

    async handle(): Promise<void> {
        const guilds = await this.client.guilds.fetch();

        for (const [guildId, guild] of guilds) {
            try {
                if (!this.flagsService.isEnabled(guildId, 'remover_cargos_de_estudantes_duplicados')) continue;

                const removals = await this.roleService.removeDuplicatedStudentRoles(guildId);

                for (const { member, removedRoles } of removals) {
                    this.logger.warn(
                        `Removed the roles ${removedRoles.map((role) => role.name).join(', ')} from ${member.username} (${member.id}) in ${guild.name} because they had more than one student role`,
                    );
                }
            } catch (error: any) {
                this.logger.error(`Failed to remove duplicated student roles in ${guild.name}: ${error.message}`, {
                    stacktrace: error.stack,
                });
            }
        }
    }
}
