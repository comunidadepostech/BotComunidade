import z from 'zod';
import type IController from '../../types/interfaces/controller.interface';
import type ILoggerService from '../../types/services/loggerService.interface';
import { AppError } from '../../types/errors.types';
import env from '../../config/env';
import type IMessageService from '../../types/services/messageService.interface';
import type IChannelService from '../../types/services/channelService.interface';
import { VACANCY_CHANNEL_NAME } from '../../utils/constants/discordConstants';
import type IGuildService from '../../types/services/guildService.interface';
import type { Channel } from '../../types/channel.types';
import type { MessageAction } from '../../types/component.types';

const schema = z.object({
    cargo: z.string().nonempty(),
    tipo_de_emprego: z.enum(['Emprego (CLT)', 'Estágio', 'Trainee']),
    empregador: z.string().nonempty(),
    modelo: z.enum(['onsite', 'hybrid', 'remote']).transform((value) => {
        switch (value) {
            case 'onsite':
                return 'Presencial';
            case 'hybrid':
                return 'Híbrido';
            case 'remote':
                return 'Remoto';
        }
    }),
    descricao: z.string().nonempty(),
    skills: z.string().nonempty(),
    localizacoes: z.array(z.string().nonempty()),
    _salario: z.string().optional(),
    data_de_publicacao: z.string().nonempty(),
    data_de_termino: z.string().nonempty(),
    referencia: z.string().nonempty(),
    clusters: z.array(
        z.enum(['Dev', 'Tech Business e Liderança', 'Cyber', 'Dados', 'Cloud & Infraestrutura', 'Creative Tech', 'IA']),
    ),
    nivel_de_vaga: z.array(
        z.enum(['Early Career', 'Professional / Experienced']).transform((value) => {
            switch (value) {
                case 'Early Career':
                    return 'Início de carreira';
                case 'Professional / Experienced':
                    return 'Profissional';
            }
        }),
    ),
    como_aplicar: z.string().nonempty(),
});

function splitLongLine(line: string, maxLength: number): string[] {
    const chunks: string[] = [];
    const words = line.split(' ');
    let current = '';

    for (const word of words) {
        if ((current + word + ' ').length > maxLength) {
            if (current) chunks.push(current.trim());
            current = word + ' ';
        } else {
            current += word + ' ';
        }
    }

    if (current) chunks.push(current.trim());
    return chunks;
}

function splitTextIntoChunks(text: string, maxLength: number = 2000): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    const lines = text.split('\n');
    let currentChunk = '';

    for (const line of lines) {
        if (line.length > maxLength) {
            if (currentChunk) {
                chunks.push(currentChunk);
            }

            const lineChunks = splitLongLine(line, maxLength);
            // Os primeiros pedaços da linha vão direto para a lista
            currentChunk = lineChunks.pop() ?? '';
            chunks.push(...lineChunks);
        } else if ((currentChunk + '\n' + line).length > maxLength) {
            chunks.push(currentChunk);
            currentChunk = line;
        } else {
            currentChunk = currentChunk ? `${currentChunk}\n${line}` : line;
        }
    }

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

export default class WebhookVacancyController implements IController {
    constructor(
        private logger: ILoggerService,
        private messageService: IMessageService,
        private channelService: IChannelService,
        private guildService: IGuildService,
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

            const {
                cargo,
                tipo_de_emprego,
                empregador,
                modelo,
                descricao,
                skills,
                localizacoes,
                _salario,
                data_de_publicacao,
                data_de_termino,
                referencia,
                clusters,
                nivel_de_vaga,
                como_aplicar,
            } = result.data;

            const guildIds = await this.guildService.getGuildIdsByClusters(clusters);
            const channels: Channel[] = [];

            for (const guildId of guildIds) {
                const channel = await this.channelService.getAllChannelsByGuildId(guildId, {
                    filterByName: VACANCY_CHANNEL_NAME,
                });
                channels.push(...channel);
            }

            // Header (role name)         <-- Thread title
            // Upper (role general info)  <-- Thread content
            // Body (description)         <-- Thread second message
            // Footer (small messages)    <-- Thread third message + buttons

            const header = [];

            // Header
            header.push(`# ${cargo}`);

            // Upper
            header.push(`**💼 Tipo de contrato:** ${tipo_de_emprego}`);
            header.push(`**🏢 Empresa:** ${empregador}`);
            header.push(`**📅 Modelo:** ${modelo}`);
            header.push(`**🔑 Skills:** ${skills}`);
            header.push(`**📍 Locais:** ${localizacoes}`);
            if (_salario) header.push(`**💰 Salário:** ${_salario}`);
            header.push(`**📈 Nível de vaga:** ${nivel_de_vaga}`);
            header.push(`**📝 Veja a descrição da vaga abaixo**`);

            // Body
            const Body = splitTextIntoChunks(`**📝 Descrição:**\n${descricao}`);

            // Footer
            const footer = `*Data de publicação: ${data_de_publicacao} | Data de término: ${data_de_termino}*`;

            const actions: MessageAction[] = [
                {
                    type: 'link',
                    label: '📋 Candidate-se aqui',
                    url: como_aplicar,
                },
                {
                    type: 'link',
                    label: '📎 Link da vaga',
                    url: referencia,
                },
            ];

            await this.messageService.sendVacancyMessage({
                threads: channels,
                header,
                body: Body,
                footer,
                title:
                    `${empregador} - ${cargo}`.length >= 100
                        ? `${empregador} - ${cargo}`.slice(0, 97) + '...'
                        : `${empregador} - ${cargo}`,
                actions,
            });

            return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
        } catch (error) {
            if (error instanceof AppError) {
                this.logger.error(error.message, { error });
                return new Response(JSON.stringify({ status: 'error', error: error.message }), { status: 400 });
            }
            throw error;
        }
    }
}
