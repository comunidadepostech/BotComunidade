import express from "express";
import {defaultEventDescription} from "../../utils/defaultEventDescription.js";
import {classChannels} from "../../utils/classPatterns.js";
import {serverNames} from "../../utils/servers.js";

class DiscordEventService {
    constructor(client) {
        this.client = client;
    }

    async createScheduledEvent(eventData) {
        const { turma, nomeEvento, tipo, data_hora, link, hora_fim } = eventData;

        if (nomeEvento.length > 100) {
            throw new Error("O nome da aula ultrapassa 100 caracteres, busque reduzir a quantidade de caracteres.");
        }

        const guild = await this.client.guilds.fetch(serverNames[turma.replace(/\d+/g, '').replace(" ", "")]);
        console.debug(`DEBUG - Servidor ${guild.name}`);
        if (!guild) {
            throw new Error(`Servidor de ${turma.replace(/\d+/g, '')} não encontrado`);
        }

        const channels = await guild.channels.fetch();
        const voiceChannel = channels.find(c => c.name === classChannels[7].name + turma && c.type === 2);
        if (!voiceChannel) {
            throw new Error(`Canal de voz para a turma ${turma} não encontrado.`);
        }
        console.debug(`DEBUG - Canal ${voiceChannel.name}`);

        let description = defaultEventDescription[tipo] instanceof Function
            ? defaultEventDescriptiontipo
            : defaultEventDescription[tipo];

        return guild.scheduledEvents.create({
            name: `${turma} - ${nomeEvento}`,
            scheduledStartTime: new Date(`${data_hora}`),
            scheduledEndTime: new Date(`${hora_fim}`),
            privacyLevel: 2,
            entityType: 2,
            channel: voiceChannel.id,
            description: description,
            image: './assets/postech.png'
        });
    }
}

export class EventsWebhook {
    constructor(){
        this.webhook = express();
        this.port = process.env.PRIMARY_WEBHOOK_PORT || 9999;
        this.eventService = null;
    }

    async createWebhook(){
        // Inicia o webhook para receber as informações de cadastro de aulas
        this.webhook.use(express.json());
    }
    
    async displayWebhook(client){
        this.eventService = new DiscordEventService(client);
        
        this.webhook.post('/criarEvento', async (req, res) => {
            console.debug('DEBUG - Dados recebidos: ', req.body);
            try {
                const scheduledEvent = await this.eventService.createScheduledEvent(req.body);
                console.log(`LOG - Evento ${scheduledEvent.name} criado com sucesso`);
                res.status(201).json({ status: 'sucesso', evento: scheduledEvent });
            } catch (error) {
                console.error(`ERRO - Falha ao criar evento via webhook:`, error);
                // O erro lançado pelo service já é uma mensagem amigável
                res.status(500).json({ status: 'erro', mensagem: error.message });
            }
        });


        this.webhook.listen(this.port, "0.0.0.0", () => {
            console.log(`Webhook aberto em: ${this.port}`);
        });

    }
}