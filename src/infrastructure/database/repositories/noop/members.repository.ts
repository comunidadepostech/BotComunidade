import type IMembersRepository from '../../../../types/repositories/members.repository';

/**
 * Modo SLIM: contagens de membros (telemetria) não são salvas em lugar nenhum.
 */
export default class NoopMembersRepository implements IMembersRepository {
    async saveTotalMembers(): Promise<void> {
        // intencionalmente vazio
    }

    async saveOnlineMembers(): Promise<void> {
        // intencionalmente vazio
    }
}
