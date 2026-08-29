import type { Client } from 'discord.js';
import type IController from '../../types/interfaces/controller.interface';
import type ILoggerService from '../../types/services/loggerService.interface';
import type IMemberService from '../../types/services/memberService.interface';
import type IFeatureFlagsService from '../../types/services/featureFlagsService.interface';
import { STUDENT_ROLE_NAME_PREFIX } from '../../utils/constants/discordConstants';

export default class TotalMembersCountController implements IController {
    constructor(private logger: ILoggerService, private memberService: IMemberService, private client: Client, private flagsService: IFeatureFlagsService) {}

    async handle(): Promise<void> {
        const guilds = await this.client.guilds.fetch()

        for (const [, guild] of guilds) {
            if (!this.flagsService.isEnabled(guild.id, 'coletar_dados_de_membros_mensalmente')) return;

            const completeGuild = await guild.fetch()

            const roles = await completeGuild.roles.fetchMemberCounts()

            for (const [roleId, total] of roles) {
                const role = await completeGuild.roles.fetch(roleId);

                if (!role!.name.split(STUDENT_ROLE_NAME_PREFIX + " ")[1]) {
                    this.logger.warn(
                        `Skipped ${role!.name} because it doesn't fit the pattern ("Estudantes {className}")`,
                    );
                    continue;
                }
                
                await this.memberService.saveTotalMembers(
                    role!.name.split(STUDENT_ROLE_NAME_PREFIX + " ")[1]!,
                    guild.name,
                    total,
                );
            }
        }
    }
}
