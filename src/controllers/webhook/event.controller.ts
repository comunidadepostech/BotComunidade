import z from 'zod';
import type IController from '../../types/interfaces/controller.interface';
import type ILoggerService from '../../types/services/loggerService.interface';
import type IEventService from '../../types/services/eventService.interface';
import { defaultEventDescription } from '../../utils/constants/eventDescription';
import { entityType } from '../../types/entityType.enum';
import type IGuildService from '../../types/services/guildService.interface';
import type IChannelService from '../../types/services/channelService.interface';
import { STUDY_GROUP_CHANNEL_NAME } from '../../utils/constants/discordConstants';
import { AppError } from '../../types/errors.types';
import { join } from 'node:path';
import { validateWebhookRequest } from '../../utils/webhook.helper';

const postSchema = z.object({
    turma: z.string().nonempty().max(7),
    nomeEvento: z.string().nonempty().max(100),
    tipo: z.enum(['Grupo de estudos', 'Live', 'Hackaton', 'Mentoria']),
    data_hora: z.coerce.date(),
    link: z.string().max(100),
    fim: z.coerce.date(),
});

const deleteSchema = z.object({
    eventId: z.string().nonempty(),
    guildId: z.string().nonempty()
})

export default class WebhookEventController implements IController {
    private backgroundImage: ArrayBuffer | null;

    constructor(
        private logger: ILoggerService,
        private eventService: IEventService,
        private guildService: IGuildService,
        private channelService: IChannelService,
    ) {
        this.backgroundImage = null;
    }

    async handle(req: Request): Promise<Response> {
        try {
            if (req.method === 'POST') {
                const result = await validateWebhookRequest(req, postSchema, this.logger)

                const guildId = await this.guildService.getGuildIdByCourseName(result.turma.replaceAll(/\d/g, ''));

                const channelId = (await this.channelService.getAllChannelsByGuildId(guildId)).find(
                    (channel) =>
                        channel.name === `${STUDY_GROUP_CHANNEL_NAME} ${result.turma}` && 
                        channel.parent?.name === result.turma,
                )?.id;

                if (!channelId) {
                    return new Response(
                        JSON.stringify({
                            status: 'error',
                            error: `The channel "${STUDY_GROUP_CHANNEL_NAME}" was not found in guild ${guildId} or in the class category`,
                        }),
                    );
                }

                if (!this.backgroundImage) {
                    const imagePath = join(import.meta.dir, '../../../assets/postech.png');
                    this.backgroundImage = await Bun.file(imagePath).arrayBuffer();
                }

                const eventId = await this.eventService.createEvent({
                    name: `${result.turma} - ${result.nomeEvento}`,
                    description: defaultEventDescription[result.tipo]!,
                    entityType: entityType.voice,
                    image: Buffer.from(this.backgroundImage),
                    scheduledStartTime: result.data_hora,
                    scheduledEndTime: result.fim,
                    channelId,
                    guilds: [guildId],
                });

                return new Response(
                    JSON.stringify({
                        status: 'success',
                        data: { ...result, eventId: eventId[0], guildId: guildId },
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    },
                );
            }

            if (req.method === 'DELETE') {
                const result = await validateWebhookRequest(req, deleteSchema, this.logger);

                await this.eventService.removeEvent(result.guildId, result.eventId)

                return new Response(
                    JSON.stringify({ status: 'success', data: result }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    },
                );
            }

            return new Response(JSON.stringify({ status: 'error', error: 'Not Found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            if (error instanceof AppError) {
                this.logger.error(error.message, { error });
                return new Response(JSON.stringify({ status: 'error', error: error.message }), { status: 400 });
            }
            throw error;
        }
    }
}
