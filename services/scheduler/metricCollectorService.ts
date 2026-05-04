import { Client, Collection, Guild, GuildMember, Role, PresenceUpdateStatus } from 'discord.js';
import type { IMetricsCollector } from '../../types/modularScheduler.interfaces.ts';
import type IFeatureFlagsService from '../../types/featureFlagsService.interface.ts';
import type IN8nService from '../../types/n8nService.interface.ts';
import type { RoleCount } from '../../types/discord.interfaces.ts';
import type { SaveMembersDto } from '../../dtos/saveMembers.dto.ts';

/**
 * MetricCollectorService - Lida com a coleta e relato de métricas do Discord
 * Implementa IMetricsCollector
 *
 * Responsabilidades:
 * - Contar membros por cargos específicos em todos os servidores (guilds)
 * - Monitorar a contagem de usuários online/ativos
 * - Relatar dados coletados para serviços externos (n8n)
 *
 * SOLID: Responsabilidade Única (Single Responsibility) - Apenas gerencia a coleta e o relato de métricas
 */
export default class MetricCollectorService implements IMetricsCollector {
    constructor(
        private readonly client: Client,
        private readonly featureFlagsService: IFeatureFlagsService,
        private readonly n8nService: IN8nService,
    ) {}

    /**
     * Coleta a contagem de membros por cargo para todos os servidores onde o recurso está habilitado
     * Os resultados são enviados para o n8n para relatórios mensais
     */
    async collectMemberCounts(): Promise<void> {
        console.time('Contagem de membros');

        const payload: SaveMembersDto = [];

        for (const guild of this.client.guilds.cache.values()) {
            if (
                !this.featureFlagsService.getFlag(guild.id, 'coletar_dados_de_membros_mensalmente')
            ) {
                continue;
            }

            const counts = await this.getMembersByRole(guild);
            payload.push(...counts);
        }

        if (payload.length > 0) {
            await this.n8nService.saveRolesMembersCount(payload);
        }

        console.timeEnd('Contagem de membros');
    }

    /**
     * Coleta o total de membros online/ativos em todos os servidores
     * Os resultados são enviados para o n8n para monitoramento em tempo real
     */
    async collectOnlinePresence(): Promise<void> {
        let totalOnlineCount = 0;

        for (const guild of this.client.guilds.cache.values()) {
            const members = await guild.members.fetch({ withPresences: true });

            const activeMembers = members.filter((member) => {
                return (
                    member.presence &&
                    [
                        PresenceUpdateStatus.Online,
                        PresenceUpdateStatus.Idle,
                        PresenceUpdateStatus.Invisible,
                        PresenceUpdateStatus.DoNotDisturb,
                    ].includes(member.presence.status)
                );
            });

            totalOnlineCount += activeMembers.size;
        }

        await this.n8nService.saveOnlineMembers(totalOnlineCount);
    }

    /**
     * Auxiliar para buscar e contar membros para os cargos de "Estudantes" em um servidor específico
     */
    private async getMembersByRole(guild: Guild): Promise<RoleCount[]> {
        const roles: Collection<string, Role> = await guild.roles.fetch();
        const members: Collection<string, GuildMember> = await guild.members.fetch();

        const roleCounts: RoleCount[] = [];

        roles.forEach((role) => {
            // Verificar se o nome do cargo começa com "Estudantes "
            if (role.name.startsWith('Estudantes ')) {
                const courseName = role.name.split('Estudantes ')[1]!;
                roleCounts.push({
                    guildName: guild.name,
                    roleName: courseName,
                    count: members.filter((member) => member.roles.cache.has(role.id)).size,
                });
            }
        });

        return roleCounts;
    }
}
