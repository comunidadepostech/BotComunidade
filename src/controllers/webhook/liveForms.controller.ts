import z from 'zod';
import type IController from '../../types/interfaces/controller.interface';
import type ILoggerService from '../../types/services/loggerService.interface';
import env from '../../config/env';
import { AppError, ChannelNotFoundError } from '../../types/errors.types';
import type IGuildService from '../../types/services/guildService.interface';
import type IChannelService from '../../types/services/channelService.interface';
import { CHAT_CHANNEL_NAME } from '../../utils/constants/discordConstants';
import type IMessageService from '../../types/services/messageService.interface';
import type IRoleService from '../../types/services/roleService.interface';

const schema = z.object({
    evento: z.string().nonempty(),
});

export default class WebhookLiveFormsController implements IController {
    constructor(
        private logger: ILoggerService,
        private guildService: IGuildService,
        private channelService: IChannelService,
        private messageService: IMessageService,
        private roleService: IRoleService,
    ) {}

    async handle(req: Request): Promise<Response> {
        try {
            if (req.headers.get('Authorization') !== 'Bearer ' + env.WEBHOOK_TOKEN)
                return new Response(
                    JSON.stringify({ status: 'error', message: 'Not authorized or authorization missing' }),
                    { status: 401 },
                );

            const body = await req.json();
            const result = schema.safeParse(body);

            if (!result.success) {
                return new Response(JSON.stringify({ status: 'error', error: z.prettifyError(result.error) }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            this.logger.http('Received request', { body: result.data });

            // The controller starts here

            const className = result.data.evento.split(' - ')[0];

            if (!className) {
                return new Response(
                    JSON.stringify({
                        status: 'error',
                        error: `Could not find any class in the event name: ${result.data.evento}`,
                    }),
                    { status: 400 },
                );
            }

            const guildId = await this.guildService.getGuildIdByCourseName(className.replaceAll(/\d/g, ''));

            const channel = (await this.channelService.getAllChannelsByGuildId(guildId)).find(
                (channel) => channel.name === CHAT_CHANNEL_NAME && channel.parent?.name === className,
            );

            if (!channel) throw new ChannelNotFoundError(CHAT_CHANNEL_NAME, this.constructor.name);

            const roleId = await this.roleService.getRoleIdByName(guildId, 'Estudantes ' + className);

            const messageId = await this.messageService.sendMessage(
                channel,
                'Fala, turma! E aí, o que acharam da live?\n' +
                    '\n' +
                    'Enquanto o conteúdo ainda está fresco na memória, queremos muito saber a sua opinião!\n' +
                    'Preencha o formulário abaixo e nos ajude a criar encontros cada vez mais incríveis. Contamos com você!\n' +
                    '\n' +
                    'Link do formulário: https://forms.gle/dFJAUdijQ6jUeZbr6\n' +
                    `<@&${roleId}>`,
            );

            setTimeout(async () => {
                await this.messageService.deleteMessage(channel.id, messageId)
            }, env.LIVE_FORMS_DURATION_IN_MINUTES * 60 * 1000);

            return new Response(JSON.stringify({ status: 'success', data: result.data }), { status: 200 });
        } catch (error) {
            if (error instanceof AppError) {
                this.logger.error(error.message, { error });
                return new Response(JSON.stringify({ status: 'error', error: error.message }), { status: 400 });
            }
            throw error;
        }
    }
}
