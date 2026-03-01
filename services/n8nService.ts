import {InteractionPayload, Poll} from "../entities/dto/n8nDTOs.ts";

export default class N8nService {
    static async savePoll(poll: Poll){
        const res = await fetch(process.env.N8N_ENDPOINT + '/salvarEnquete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': process.env.N8N_TOKEN ?? ""
            },
            body: JSON.stringify(poll)
        })

        if (!res.ok) throw new Error(`Falha ao enviar enquete para o n8n: ${res.status} ${res.statusText}`)
    }

    static async saveInteraction(interaction: InteractionPayload) {
        const res = await fetch(process.env.N8N_ENDPOINT + '/salvarInteracao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': process.env.N8N_TOKEN ?? ""
            },
            body: JSON.stringify(interaction)
        });

        if (!res.ok) throw new Error(`Falha ao enviar interação para o n8n: ${res.status} ${res.statusText}`);
    }
}