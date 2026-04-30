import { STUDY_GROUP_CHANNEL_NAME, WARNING_CHANNEL_NAME } from '../constants/discordConstants.ts';
import { defaultEventDescription } from '../constants/eventDescription.ts';
import { ChannelType, Role, TextChannel, VoiceChannel, Client } from 'discord.js';
import { env } from '../config/env.ts';
import type { IDiscordService } from '../types/discord.interfaces.ts';
import type IFeatureFlagsService from '../types/featureFlagsService.interface.ts';
import type { IGuildsRepository } from '../types/repository.interfaces.ts';
import { InputValidator, GuildValidator } from '../utils/validators.ts';
import type { EventValidationInput } from '../utils/validators.ts';
import { UnauthorizedError, ValidationError, NotFoundError } from '../types/errors.ts';

/**
 * WebhookController - Controlador enxuto para requisições de webhook
 * Lida com requisições de API externa (N8n) que gerenciam operações do Discord
 *
 * Responsabilidades:
 * - Validar requisições recebidas
 * - Delegar para os serviços apropriados
 * - Retornar respostas estruturadas
 *
 * Princípios SOLID:
 * - Responsabilidade Única (Single Responsibility): Apenas roteia requisições de webhook
 * - Inversão de Dependência (Dependency Inversion): Depende de interfaces de serviço
 * - Aberto/Fechado (Open/Closed): Pode ser estendido com novos métodos de webhook
 *
 * Segurança:
 * - Validação de token em todos os endpoints
 * - Validação de entrada antes das chamadas de serviço
 * - Mensagens de erro não expõem detalhes internos
 */
export class WebhookController {
    constructor(
        private context: {
            client: Client;
            featureFlagsService: IFeatureFlagsService;
            discordService: IDiscordService;
            guildsRepository: IGuildsRepository;
        },
    ) {}

    /**
     * Gerencia a criação de eventos externos via webhook
     *
     * Valida:
     * - Token de webhook
     * - Comprimento do nome do evento
     * - Datas do evento (não no passado, término após o início)
     * - Existência de servidor/canal
     *
     * @param req - Requisição com dados do evento
     * @returns Resposta com status ou erro
     */
    async EventManagement(req: Request): Promise<Response> {
        try {
            const body = (await req.json()) as {
                nomeEvento: string;
                data_hora: string;
                fim: string;
                turma: string;
                link: string;
                tipo: string;
            };

            // Validar o token de webhook
            InputValidator.validateWebhookToken(req.headers.get('token'), env.WEBHOOK_TOKEN);

            // Validar a entrada do evento
            const validationInput: EventValidationInput = {
                eventName: body.nomeEvento,
                startDate: body.data_hora,
                endDate: body.fim,
                courseCode: body.turma,
                type: body.tipo,
                link: body.link,
            };
            InputValidator.validateEventInput(validationInput);

            // Normalizar o código do curso para encontrar o servidor
            const normalizedCourseCode = GuildValidator.normalizeCourseCode(body.turma);
            GuildValidator.validateNormalizedCourseCode(normalizedCourseCode);

            const guildId = this.context.guildsRepository.getGuildIdByCourse(normalizedCourseCode);
            if (!guildId) {
                throw new NotFoundError(
                    `Guild not found for course: ${body.turma}. Please ensure the course is configured.`,
                    'Guild',
                );
            }

            const client = this.context.client;
            const guild = await client.guilds.fetch(guildId);

            // Encontrar a descrição do evento para este tipo de evento
            const description =
                defaultEventDescription[body.tipo as keyof typeof defaultEventDescription];
            if (!description) {
                throw new NotFoundError(
                    `No description found for event type: ${body.tipo}`,
                    'EventType',
                );
            }

            // Encontrar o canal do grupo de estudos para este curso
            const channel = guild.channels.cache.find(
                (guildChannel) =>
                    guildChannel.name === STUDY_GROUP_CHANNEL_NAME + ' ' + body.turma &&
                    guildChannel.type === ChannelType.GuildVoice &&
                    guildChannel.parent?.name === body.turma,
            );

            if (!channel) {
                throw new NotFoundError(
                    `Study group channel not found for course: ${body.turma}`,
                    'Channel',
                );
            }

            // Delegar para o serviço
            await this.context.discordService.events.create({
                topic: body.turma + ' - ' + body.nomeEvento,
                description: description.replaceAll('{link}', body.link),
                endDatetime: new Date(body.fim),
                guildId: guild.id,
                link: body.link,
                source: 'external',
                startDatetime: new Date(body.data_hora),
                type: body.tipo as 'Grupo de estudos' | 'Live' | 'Mentoria' | 'Hackaton',
                channel: channel as VoiceChannel,
            });

            return Response.json({ status: 'success' }, { status: 200 });
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Envia o link de feedback da enquete ao vivo após o evento de transmissão ao vivo
     *
     * Valida:
     * - Token de webhook
     * - Formato do identificador do evento
     * - Existência de servidor/cargo/canal
     * - Flag de funcionalidade habilitada
     *
     * @param req - Requisição com o identificador do evento
     * @returns Resposta com status
     */
    async SendLivePoll(req: Request): Promise<Response> {
        try {
            const body = (await req.json()) as { evento?: string };

            // Validar o token de webhook
            InputValidator.validateWebhookToken(req.headers.get('token'), env.WEBHOOK_TOKEN);

            // Validar o identificador do evento
            InputValidator.validatePollInput(body.evento);

            const classNameWithNumber = body.evento!.split(' - ')[0];
            const classNameWithoutNumber = GuildValidator.normalizeCourseCode(
                classNameWithNumber || '',
            );

            const guildId =
                this.context.guildsRepository.getGuildIdByCourse(classNameWithoutNumber);
            if (!guildId) {
                console.warn(
                    `Guild not found for course: ${classNameWithoutNumber}, poll send cancelled`,
                );
                return Response.json({});
            }

            const client = this.context.client;
            const guild = await client.guilds.fetch(guildId);

            // Verificar se a funcionalidade está habilitada
            if (
                !this.context.featureFlagsService.getFlag(guild.id, 'enviar_forms_no_final_da_live')
            ) {
                console.warn(`Poll sending disabled in guild: ${guild.name}`);
                return Response.json({});
            }

            // Encontrar o cargo da turma
            const role = guild.roles.cache.find(
                (roleItem: Role) => roleItem.name === `Estudantes ${classNameWithNumber}`,
            );
            if (!role) {
                throw new NotFoundError(
                    `Class role not found for course: ${classNameWithNumber}`,
                    'Role',
                );
            }

            // Encontrar o canal de bate-papo
            const channels = guild.channels.cache
                .filter((channelItem) => channelItem.name === '💬│bate-papo')
                .values();

            for (const channel of channels) {
                if (!channel.isTextBased()) {
                    continue;
                }

                const parentName = guild.channels.cache.get(channel.parentId!)?.name;
                if (parentName !== classNameWithNumber) {
                    continue;
                }

                // Delegar para o serviço
                await this.context.discordService.messages.sendLivestreamPoll(
                    channel as TextChannel,
                    role,
                );
                return Response.json({ status: 'success' }, { status: 200 });
            }

            throw new NotFoundError(
                `Chat channel not found for course: ${classNameWithNumber}`,
                'Channel',
            );
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Envia mensagem de aviso/alerta para um curso específico
     *
     * Valida:
     * - Token de webhook
     * - Mensagem e código do curso fornecidos
     * - Existência de servidor/canal/cargo
     *
     * @param req - Requisição com mensagem e código do curso
     * @returns Resposta com status
     */
    async sendWarning(req: Request): Promise<Response> {
        try {
            const body = (await req.json()) as { mensagem?: string; turma?: string };

            // Validar o token de webhook
            InputValidator.validateWebhookToken(req.headers.get('token'), env.WEBHOOK_TOKEN);

            // Validar a entrada de aviso
            InputValidator.validateWarningInput(body.mensagem, body.turma);

            const normalizedCourse = GuildValidator.normalizeCourseCode(body.turma!);
            const guildId = this.context.guildsRepository.getGuildIdByCourse(normalizedCourse);

            if (!guildId) {
                throw new NotFoundError(`Guild not found for course: ${body.turma}`, 'Guild');
            }

            const guild = this.context.client.guilds.cache.get(guildId);
            if (!guild) {
                throw new NotFoundError(`Guild not in client cache: ${guildId}`, 'Guild');
            }

            // Encontrar o canal de aviso
            const channel = guild.channels.cache.find(
                (guildChannel) =>
                    guildChannel.parent?.name === body.turma &&
                    guildChannel.name === WARNING_CHANNEL_NAME &&
                    guildChannel.type === ChannelType.GuildText,
            );

            if (!channel || !channel.isTextBased()) {
                throw new NotFoundError(
                    `Warning channel not found for course: ${body.turma}`,
                    'Channel',
                );
            }

            // Encontrar o cargo da turma
            const role = guild.roles.cache.find(
                (roleItem) => roleItem.name === 'Estudantes ' + body.turma,
            );
            if (!role) {
                throw new NotFoundError(`Class role not found for course: ${body.turma}`, 'Role');
            }

            // Delegar para o serviço
            await this.context.discordService.messages.sendWarning({
                channel: channel as TextChannel,
                message: body.mensagem!,
                role,
            });

            return Response.json({});
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Manipulador de erros centralizado
     * Converte erros da aplicação em respostas HTTP
     */
    private handleError(error: unknown): Response {
        if (error instanceof UnauthorizedError) {
            return Response.json({ error: error.message }, { status: error.statusCode });
        }

        if (error instanceof ValidationError) {
            return Response.json(
                {
                    error: error.message,
                    details: error.fieldErrors,
                },
                { status: error.statusCode },
            );
        }

        if (error instanceof NotFoundError) {
            return Response.json({ error: error.message }, { status: error.statusCode });
        }

        if (error instanceof Error) {
            console.error(`Webhook error: ${error.message}`);
            return Response.json({ error: 'Internal server error' }, { status: 500 });
        }

        console.error(`Unknown webhook error: ${String(error)}`);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
