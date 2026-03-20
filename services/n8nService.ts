import type {InteractionPayload, Poll} from "../dtos/n8n.dtos.ts";
import type StudyGroupAnalysisPayload from "../dtos/studyGroupAnalysis.dto.ts";
import {env} from "../config/env.ts";
import type IN8nService from "../types/n8nService.interface.ts";
import type {SaveMembersDto} from "../dtos/saveMembersDto.ts";

export default class N8nService implements N8nService {
    async savePoll(poll: Poll){
        const res = await fetch(env.N8N_ENDPOINT + '/salvarEnquete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': env.N8N_WEBHOOKS_TOKEN!
            },
            body: JSON.stringify(poll)
        })

        if (!res.ok) throw new Error(`Falha ao enviar enquete para o n8n: ${res.status} ${res.statusText}`)
    }

    async saveInteraction(interaction: InteractionPayload) {
        const res = await fetch(env.N8N_ENDPOINT + '/salvarInteracao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': env.N8N_WEBHOOKS_TOKEN
            },
            body: JSON.stringify(interaction)
        });

        if (!res.ok) throw new Error(`Falha ao enviar interação para o n8n: ${res.status} ${res.statusText}`);
    }

    async saveStudyGroupAnalysis(payload: StudyGroupAnalysisPayload) {
        const res = await fetch(env.N8N_ENDPOINT + '/salvarDadosGrupoEstudo', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "token": env.N8N_WEBHOOKS_TOKEN
            },
            body: JSON.stringify(payload)
        });
        console.error(`Erro ao enviar dados do evento ${payload} para o n8n: ${res.status} ${res.statusText}`);
    }

    async saveMembersData(payload: SaveMembersDto) {
        const res = await fetch(`${env.N8N_ENDPOINT}/salvarMembros`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + env.N8N_WEBHOOKS_TOKEN
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) console.error(`Erro ao enviar dados para o n8n: ${res.status} ${res.statusText}}`);
    }

}