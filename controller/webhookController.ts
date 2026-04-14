import {STUDY_GROUP_CHANNEL_NAME, WARNING_CHANNEL_NAME} from "../constants/discordConstants.ts";
import {defaultEventDescription} from "../constants/eventDescription.ts";
import {ChannelType, Role, TextChannel, VoiceChannel, Client} from "discord.js";
import {env} from "../config/env.ts";
import type DiscordService from "../services/discordService.ts";
import type FeatureFlagsService from "../services/featureFlagsService.ts";
import type DatabaseGuildsRepository from "../repositories/database/databaseGuildsRepository.ts";

export class WebhookController {
    constructor(
        private context: { 
            client: Client, 
            featureFlagsService: FeatureFlagsService, 
            discordService: DiscordService,
            databaseGuildsRepository: DatabaseGuildsRepository
        }
    ) {}

    async EventManagement(req: Request): Promise<Response> {
        const body = await req.json()

        try {
            if (req.headers.get("token") !== env.WEBHOOK_TOKEN) {
                return Response.json(
                    {"message": "Invalid token"}, 
                    {status: 401}
                )
            }

            if (body.nomeEvento.length > 100) {
                return Response.json(
                    {message: "O nome do evento passa o limite de 100 caracteres!"}, 
                    {status: 400}
                )
            }

            if(new Date(body.data_hora).getTime() < Date.now()) {
                return Response.json(
                    {message: "Você não pode registrar um evento no passado!"}, 
                    {status: 400}
                )
            }

            if(new Date(body.fim).getTime() < new Date(body.data_hora).getTime()) {
                return Response.json(
                    {message: "Você não pode registrar um evento que acabara antes dele mesmo"}, 
                    {status: 400}
                )
            }

            const client = this.context.client;
            const eventService = this.context.discordService.events
            const guildId = this.context.databaseGuildsRepository.getGuildIdByCourse(body.turma.replaceAll(/\d+/g, ''))

            if (!guildId) {
                console.error("Guilda não encontrada para a turma: " + body.turma + "\n" + JSON.stringify(body, null, 2))
                return Response.json(
                    {message: "Guilda não encontrada para a turma: " + body.turma + 
                    "\n" + JSON.stringify(body, null, 2)}, {status: 500}
                )
            }

            const guild = await client.guilds.fetch(guildId)

            const description = defaultEventDescription[body.tipo]

            if (!description) {
                console.error("Nenhuma descrição foi encontrada para o tipo de evento a ser cadastrado: " + body.tipo)
                return Response.json(
                    {message: "O tipo de evento a ser cadastrado não é conhecido pelo Bot: " + body.tipo + " - reporte esse erro"}, 
                    {status: 500}
                )
            }

            const channel = guild.channels.cache.find(channel =>
                channel.name === STUDY_GROUP_CHANNEL_NAME + " " + body.turma &&
                channel.type === ChannelType.GuildVoice &&
                channel.parent?.name === body.turma
            )

            if (!channel) {
                console.error("Nenhum canal de estudo foi encontrado para a turma: " + body.turma)
                return Response.json(
                    {message: "Nenhum canal de estudo foi encontrado para a turma: " + body.turma}, 
                    {status: 500}
                )
            }

            await eventService.create({
                topic: body.turma + " - " + body.nomeEvento,
                description: description.replaceAll("{link}", body.link),
                endDatetime: body.fim,
                guildId: guild.id,
                link: body.link,
                source: "external",
                startDatetime: body.data_hora,
                type: body.tipo,
                channel: channel as VoiceChannel
            });

            return Response.json({ status: "sucesso" }, {status: 200})
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            const stack = error instanceof Error ? error.stack : undefined;
            console.error(message, stack)
            return Response.json({ error: message }, {status: 500})

        }
    }

    async SendLivePoll(req: Request): Promise<Response> {
        const body = await req.json()

        if (req.headers.get("token") !== env.WEBHOOK_TOKEN) {
            return Response.json(JSON.stringify({"message": "Invalid token"}), {status: 401})
        }

        const client = this.context.client;
        const featureFlagsService = this.context.featureFlagsService
        const messagingService = this.context.discordService.messages

        if (!body.evento) {
            console.error("Para envir a mensagem é necessário especificar o 'evento' com a turma e título do evento separados por ' - '");
            return Response.json({error: "Para envir a mensagem é necessário especificar o 'evento' com a turma e título do evento separados por ' - '"}, {status: 500})
        }

        // Formata o nome da turma com o número da frente
        const classNameWithNumber: string = body.evento.split(" - ")[0]

        // Formata o nome da turma sem o número (para identificar o servidor)
        const classNameWithoutNumber: string = classNameWithNumber.replaceAll(/\d+/g, '')

        // Se o servidor não for encontrado ignora o evento e registra um warn
        if (!this.context.databaseGuildsRepository.getGuildIdByCourse(classNameWithoutNumber)) {
            console.warn(`Envio de link de feedback suprimido pois o evento não é válido: ${body.evento}`)
            return Response.json({})
        }

        const guildId = this.context.databaseGuildsRepository.getGuildIdByCourse(classNameWithoutNumber)

        if (!guildId) {
            console.error("Guilda não encontrada para a turma: " + classNameWithoutNumber);
            return Response.json({error: "Não foi possível encontrar a turma " + classNameWithoutNumber}, {status: 500})
        }

        // Tenta dar fetch na guild usando a nomenclatura da turma
        const guild = await client.guilds.fetch(guildId);

        // Verifica se o servidor tem a feature habilitada
        if (!featureFlagsService.getFlag(guild.id, "enviar_forms_no_final_da_live")) {
            console.warn(`Envio de link de feedback das lives desabilitado no servidor ${guild.name} - Envio cancelado`)
            return Response.json({})
        }

        // Busca o cargo da turma
        const role = guild.roles.cache.find((role: Role) => role.name === `Estudantes ${classNameWithNumber}`)

        if (!role) {
            console.error("Cargo da turma não encontrado");
            return Response.json({error: "Cargo da turma não encontrado"}, {status: 500})
        }

        const channels = guild.channels.cache.filter(channel => channel.name === "💬│bate-papo").values()

        for (const channel of channels) {
            const parentName: string = guild.channels.cache.get(channel.parentId!)!.name // Busca o nome da turma nas categorias

            if (!channel.isTextBased()) continue

            if (parentName !== classNameWithNumber) continue

            await messagingService.sendLivestreamPoll(channel as TextChannel, role)
            return Response.json({status: "sucess"}, {status: 200})
        }

        console.error("Nenhum canal de avisos encontrado na turma");
        return Response.json({error: "Nenhum canal de avisos encontrado na turma"}, {status: 500})
    }

    async sendWarning(req: Request): Promise<Response> {
        const body = await req.json()
        
        try {
            if (req.headers.get("token") !== env.WEBHOOK_TOKEN) {
                return Response.json({"message": "Invalid token"}, {status: 401})
            }

            const messagingService = this.context.discordService.messages

            const mensagem: string | undefined = body?.mensagem;
            const turma: string | undefined = body?.turma;

            if (!mensagem || !turma) throw new Error("O aviso precisa de uma mensagem e turma para ser entregue!")

            const id_do_servidor: string | undefined = this.context.databaseGuildsRepository.getGuildIdByCourse(turma.replaceAll(/\d+/g, ''));
            
            if (!id_do_servidor) throw new Error(`O servidor da turma ${turma} não foi encontrado, o mesmo já foi adicionado as constantes?`)

            const servidor = this.context.client.guilds.cache.get(id_do_servidor)
            
            if (!servidor) throw new Error(`O servidor da turma ${turma} não foi encontrado. O bot está nesse servidor?`)
            
            const canal = servidor.channels.cache.find(
                channel => channel.parent?.name === turma && 
                channel.name === WARNING_CHANNEL_NAME && 
                channel.type === ChannelType.GuildText
            )
            
            if (!canal) throw new Error(`O canal de avisos da turma ${turma} não foi encontrado!`)

            const cargo = servidor.roles.cache.find(role => role.name === "Estudantes " + turma)
            
            if (!cargo) throw new Error(`Cargo da turma ${turma} não foi encontrado!`)

            if (!canal.isTextBased()) throw new Error("O canal encontrado não é um canal de texto")
            
            await messagingService.sendWarning({channel: canal as TextChannel, message: mensagem, role: cargo})

            return Response.json({})
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            const stack = error instanceof Error ? error.stack : undefined;
            console.error(message, stack);
            return Response.json({ error: message }, {status: 500})
        }
    }
}