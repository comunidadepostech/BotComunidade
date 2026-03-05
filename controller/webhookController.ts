import { Request, Response } from "express"; // Supondo Express
import {DISCORD_GUILDS, STUDY_GROUP_CHANNEL_NAME, WARNING_CHANNEL_NAME} from "../constants/discordContants.ts";
import EventService from "../services/eventService.ts";
import {defaultEventDescription} from "../constants/eventDescription.ts";
import {ChannelType, Role, TextChannel} from "discord.js";
import MessagingService from "../services/messagingService.ts";

export class WebhookController {
    static async EventManagement(req: Request, res: Response) {
        try {
            if (req.headers.token !== process.env.WEBHOOK_TOKEN) {
                res.status(401).json({"message": "Invalid token"})
                return
            }

            const client = req.discordClient;
            let guildId = DISCORD_GUILDS[req.body.turma.replaceAll(/\d+/g, '')]

            if (!guildId) {
                console.error("Guilda não encontrada para a turma: " + req.body.turma + "\n" + JSON.stringify(req.body, null, 2))
                return
            }

            const guild = await client.guilds.fetch(guildId)

            const description = defaultEventDescription[req.body.tipo]

            if (!description) {
                console.error("Nenhuma descrição foi encontrada para o tipo de evento a ser cadastrado: " + req.body.tipo)
                return
            }

            const channel = guild.channels.cache.find(channel => channel.name === STUDY_GROUP_CHANNEL_NAME + " " + req.body.turma && channel.type === ChannelType.GuildVoice && channel.parent?.name === req.body.turma)

            if (!channel) {
                console.error("Nenhum canal de estudo foi encontrado para a turma: " + req.body.turma)
                return
            }

            await EventService.createEvent({
                class: req.body.turma,
                description: description.replaceAll("{link}", req.body.link),
                endDatetime: req.body.fim,
                guild: guild,
                link: req.body.link,
                origin: "external",
                startDatetime: req.body.data_hora,
                topic: req.body.nomeEvento,
                type: req.body.tipo,
                channel: channel // Sim, o ts reclama, mas o channel já filtra o tipo de canal
            });

            return res.status(200).json({ status: "sucesso" });
        } catch (error: any) {
            console.error(error);
            return res.status(400).json({ error: error.message });
        }
    }

    static async SendLivePoll(req: Request, res: Response) {
        try {
            if (req.headers.token !== process.env.WEBHOOK_TOKEN) {
                res.status(401).json(JSON.stringify({"message": "Invalid token"}))
                return
            }

            const client = req.discordClient;
            const featureFlagsService = req.featureFlagsService

            if (!req.body.evento) throw new Error("Para envir a mensagem é necessário especificar o 'evento' com a turma e título do evento separados por ' - '");

            // Formata o nome da turma com o número da frente
            const classNameWithNumber: string = req.body.evento.split(" - ")[0]

            // Formata o nome da turma sem o número (para identificar o servidor)
            const classNameWithoutNumber: string = classNameWithNumber.replaceAll(/\d+/g, '')

            // Se o servidor não for encontrado ignora o evento e registra um warn
            if (!DISCORD_GUILDS[classNameWithoutNumber]) {
                console.warn(`Envio de link de feedback suprimido pois o evento não é válido: ${req.body.evento}`)
                return
            }

            // Tenta dar fetch na guild usando a nomenclatura da turma
            const guild = await client.guilds.fetch(DISCORD_GUILDS[classNameWithoutNumber]);

            // Verifica se o servidor tem a feature habilitada

            if (!featureFlagsService.flags[guild.id]!["enviar_forms_no_final_da_live"]) {
                console.warn(`Envio de link de feedback das lives desabilitado no servidor ${guild.name} - Envio cancelado`)
                return
            }

            // Busca o cargo da turma
            const role = guild.roles.cache.find((role: Role) => role.name === `Estudantes ${classNameWithNumber}`)

            if (!role) throw new Error("Cargo da turma não encontrado")

            const channels = guild.channels.cache.filter(channel => channel.name === "💬│bate-papo").values()

            for (const channel of channels) {
                const parentName: string = guild.channels.cache.get(channel.parentId!)!.name // Busca o nome da turma nas categorias

                if (!channel.isTextBased()) continue

                if (parentName !== classNameWithNumber) continue

                await MessagingService.sendLivePoll(channel as TextChannel, role)
                return res.status(200);
            }

            throw new Error("Nenhum canal de avisos encontrado na turma")
        } catch (error: any) {
            console.error(error);
            return res.status(400).json({error: error.message});
        }
    }

    static async sendWarning(req: Request, res: Response) {
        try {
            if (req.headers.token !== process.env.WEBHOOK_TOKEN) {
                res.status(401).json(JSON.stringify({"message": "Invalid token"}))
                return
            }

            const mensagem: string | undefined = req.body?.mensagem;
            const turma: string | undefined = req.body?.turma;
            const client = req.discordClient;

            if (!mensagem || !turma) throw new Error("O aviso precisa de uma mensagem e turma para ser entregue!")

            const id_do_servidor: string | undefined = DISCORD_GUILDS[turma.replaceAll(/\d+/g, '') as keyof typeof DISCORD_GUILDS];
            if (!id_do_servidor) throw new Error(`O servidor da turma ${turma} não foi encontrado, o mesmo já foi adicionado as constantes?`)

            const servidor = client.guilds.cache.get(id_do_servidor)
            if (!servidor) throw new Error(`O servidor da turma ${turma} não foi encontrado. O bot está nesse servidor?`)
            const canal = servidor.channels.cache.find(channel => channel.parent?.name === turma && channel.name === WARNING_CHANNEL_NAME)
            if (!canal) throw new Error(`O canal de avisos da turma ${turma} não foi encontrado!`)

            const cargo = servidor.roles.cache.find(role => role.name === "Estudantes " + turma)
            if (!cargo) throw new Error(`Cargo da turma ${turma} não foi encontrado!`)

            if (!canal.isTextBased()) return // Verificação para o TS não reclamar
            await MessagingService.sendWarning(canal, mensagem, cargo)
        } catch (error: any) {
            console.error(error);
            return res.status(400).json({error: error.message});
        }
    }
}