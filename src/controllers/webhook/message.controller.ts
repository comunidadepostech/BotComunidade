import z from 'zod';
import type IController from '../../types/interfaces/controller.interface';
import type ILoggerService from '../../types/services/loggerService.interface';
import { AppError } from '../../types/errors.types';
import type IGuildService from '../../types/services/guildService.interface';
import type IChannelService from '../../types/services/channelService.interface';
import type IMessageService from '../../types/services/messageService.interface';
import { WARNING_CHANNEL_NAME } from '../../utils/constants/discordConstants';
import type IRoleService from '../../types/services/roleService.interface';
import { validateWebhookRequest } from '../../utils/webhook.helper';

const schema = z.object({
    turma: z.string().nonempty().max(7),
    mensagem: z.string().nonempty().max(2000),
});

export default class WebhookMessageController implements IController {
    constructor(
        private logger: ILoggerService,
        private guildService: IGuildService,
        private channelService: IChannelService,
        private messageService: IMessageService,
        private roleService: IRoleService
    ) {}

    async handle(req: Request): Promise<Response> {
        try {
            const result = await validateWebhookRequest(req, schema, this.logger);

            const guildId = await this.guildService.getGuildIdByCourseName(result.turma.replaceAll(/\d/g, ''));

            const channel = (await this.channelService.getAllChannelsByGuildId(guildId)).find(
                (channel) => channel.name === WARNING_CHANNEL_NAME && channel.parent?.name === result.turma,
            );

            if (!channel) {
                return new Response(
                    JSON.stringify({
                        status: 'error',
                        error: `The channel "${WARNING_CHANNEL_NAME}" was not found in guild ${guildId} or in the class category`,
                    }),
                );
            }

            if (result.mensagem.includes('{cargo}')) {
                const roleId = await this.roleService.getRoleIdByName(guildId, 'Estudantes ' + result.turma)
                result.mensagem = result.mensagem.replaceAll('{cargo}', `<@&${roleId}>`);
            }

            await this.messageService.sendMessage(channel, result.mensagem);

            return new Response(JSON.stringify({ status: 'success', data: result }), {
                status: 200,
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
