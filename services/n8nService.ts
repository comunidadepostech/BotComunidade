import type { InteractionPayload, Poll } from '../dtos/n8n.dtos.ts';
import type StudyGroupAnalysisPayload from '../dtos/studyGroupAnalysis.dto.ts';
import { env } from '../config/env.ts';
import type { SaveMembersDto } from '../dtos/saveMembers.dto.ts';
import type IN8nService from '../types/n8nService.interface.ts';

export default class N8nService implements IN8nService {
    private defaultHeaders: Record<string, string>;
    constructor(private token: string) {
        this.defaultHeaders = { 'Content-Type': 'application/json', token: this.token };
    }

    async savePoll(poll: Poll): Promise<void> {
        const res = await fetch(env.N8N_ENDPOINT + '/salvarEnquete', {
            method: 'POST',
            headers: this.defaultHeaders,
            body: JSON.stringify(poll),
        });

        if (!res.ok)
            throw new Error(`Falha ao enviar enquete para o n8n: ${res.status} ${res.statusText}`);
    }

    async saveInteraction(interaction: InteractionPayload): Promise<void> {
        const res = await fetch(env.N8N_ENDPOINT + '/salvarInteracao', {
            method: 'POST',
            headers: this.defaultHeaders,
            body: JSON.stringify(interaction),
        });

        if (!res.ok)
            throw new Error(
                `Falha ao enviar interação para o n8n: ${res.status} ${res.statusText}`,
            );
    }

    async saveStudyGroupAnalysis(payload: StudyGroupAnalysisPayload): Promise<void> {
        const res = await fetch(env.N8N_ENDPOINT + '/salvarDadosGrupoEstudo', {
            method: 'POST',
            headers: this.defaultHeaders,
            body: JSON.stringify(payload),
        });
        if (!res.ok)
            throw new Error(
                `Falha ao enviar dados do grupo de estudo para o n8n: ${res.status} ${res.statusText} ${JSON.stringify(payload)}`,
            );
    }

    async saveRolesMembersCount(payload: SaveMembersDto): Promise<void> {
        const res = await fetch(`${env.N8N_ENDPOINT}/salvarMembros`, {
            method: 'POST',
            headers: this.defaultHeaders,
            body: JSON.stringify(payload),
        });

        if (!res.ok)
            throw new Error(
                `Erro ao enviar dados de quantidade de membros para o n8n: ${res.status} ${res.statusText}}`,
            );
    }

    async saveOnlineMembers(payload: number): Promise<void> {
        const res = await fetch(`${env.N8N_ENDPOINT}/salvarMembrosOnline`, {
            method: 'POST',
            headers: this.defaultHeaders,
            body: JSON.stringify({ count: payload }),
        });

        if (!res.ok)
            throw new Error(
                `Erro ao enviar dados de membros online para o n8n: ${res.status} ${res.statusText}}`,
            );
    }
}
