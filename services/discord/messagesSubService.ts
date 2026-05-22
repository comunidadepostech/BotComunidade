import type { IDiscordMessageService } from '../../types/discord.interfaces.ts';
import type IFeatureFlagsService from '../../types/featureFlagsService.interface.ts';
import type ILinkedInService from '../../types/linkedinService.interface.ts';
import {
    AttachmentBuilder,
    Client,
    MessageFlags,
    PollLayoutType,
    Role,
    TextChannel,
    ComponentType,
    ButtonStyle,
    ButtonBuilder,
    ChannelType,
    ForumChannel,
    ActionRowBuilder,
} from 'discord.js';
import { createCanvas, Image, loadImage } from '@napi-rs/canvas';
import path from 'node:path';
import { request } from 'undici';
import type { BroadcastMessageDto } from '../../dtos/broadcastMessage.dto.ts';
import type SendWarningDto from '../../dtos/sendWarning.dto.ts';
import type SendWelcomeMessageDto from '../../dtos/sendWelcomeMessage.dto.ts';
import type { PollMessageDto } from '../../dtos/pollMessage.dto.ts';
import { ROLE_NAME_REPLACEMENT, VACANCY_CHANNEL_NAME } from '../../constants/discordConstants.ts';
import { FIVE_MINUTES_IN_MILLISECONDS } from '../../constants/globalConstants.ts';
import type VacancyMessageDto from '../../dtos/vacancyMessage.dto.ts';

import type { IGuildsRepository } from '../../types/repository.interfaces.ts';

/**
 * MessagesSubService - Lida com operações de mensagens do Discord
 * Implementa a interface IDiscordMessageService
 *
 * Responsabilidades:
 * - Enviar mensagens de transmissão (broadcast) entre canais
 * - Enviar mensagens de aviso com menções a cargos (roles)
 * - Criar enquetes com múltiplas opções
 * - Enviar mensagens de boas-vindas com avatares de usuários
 * - Enviar formulários de feedback de transmissões ao vivo
 */
export default class MessagesSubService implements IDiscordMessageService {
    /**
     * Imagem de fundo em cache para geração de mensagens de boas-vindas
     * Carregada uma vez e reutilizada para melhorar o desempenho
     */
    private background: Image | null = null;

    /**
     * Rastreia quando as mensagens de aviso foram enviadas pela última vez por canal
     * Usado para limitar a frequência (rate-limit) de mensagens de aviso (cooldown de 5 minutos)
     */
    private sentWarnings: Map<string, number> = new Map();

    /**
     * Divide um texto em blocos respeitando o limite de caracteres e quebras de linha
     * Prefere quebrar em quebras de linha para não cortar palavras ao meio
     */
    private splitTextIntoChunks(text: string, maxLength: number = 2000): string[] {
        if (text.length <= maxLength) {
            return [text];
        }

        const chunks: string[] = [];
        const lines = text.split('\n');
        let currentChunk = '';

        for (const line of lines) {
            // Se uma linha única é maior que maxLength, precisamos quebrá-la mesmo assim
            if (line.length > maxLength) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                }
                // Quebrar a linha longa em palavras
                const words = line.split(' ');
                let wordChunk = '';
                for (const word of words) {
                    if ((wordChunk + word + ' ').length > maxLength) {
                        if (wordChunk) {
                            chunks.push(wordChunk.trim());
                        }
                        wordChunk = word + ' ';
                    } else {
                        wordChunk += word + ' ';
                    }
                }
                if (wordChunk) {
                    currentChunk = wordChunk.trim();
                }
            } else if ((currentChunk + line + '\n').length > maxLength) {
                // Adicionar a linha atual causaria overflow
                chunks.push(currentChunk);
                currentChunk = line;
            } else {
                // Adicionar a linha ao chunk atual
                if (currentChunk) {
                    currentChunk += '\n' + line;
                } else {
                    currentChunk = line;
                }
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    constructor(
        private client: Client,
        private featureFlagsService: IFeatureFlagsService,
        private linkedinService: ILinkedInService,
        private guildsRepository: IGuildsRepository,
    ) {}

    /**
     * Cria e envia uma enquete para um canal
     * Enquetes suportam múltiplas opções e seleção múltipla
     */
    async createPoll(dto: PollMessageDto): Promise<void> {
        await dto.channel.send({
            poll: {
                question: dto.question,
                answers: dto.options,
                allowMultiselect: dto.allowMultiSelect,
                duration: dto.duration,
                layoutType: PollLayoutType.Default,
            },
        });
    }

    /**
     * Transmite uma mensagem para múltiplos canais
     * Pode visar um canal específico ou transmitir para todos os servidores (guilds)
     */
    async broadcast(dto: BroadcastMessageDto): Promise<void> {
        const payload = {
            content: dto.content,
            files: dto.files,
        };

        if (dto.onlyTargetChannel) {
            await dto.targetChannel.send(payload);
            return;
        }

        // Transmitir para todos os canais com nome correspondente em todos os servidores
        await Promise.all(
            [...this.client.guilds.cache.values()].flatMap((guild) =>
                [
                    ...guild.channels.cache
                        .filter((channel) => channel.name === dto.targetChannel.name)
                        .values(),
                ]
                    .filter((channel) => channel.isTextBased())
                    .map((channel) => channel.send(payload)),
            ),
        );
    }

    /**
     * Transmite uma vaga de emprego para todos os servidores correspondentes do(s) cluster(s)
     * Divide a descrição em múltiplas mensagens se necessário para respeitar o limite do Discord (2000 caracteres)
     */
    async sendVacancyMessage(dto: VacancyMessageDto): Promise<void> {
        // Construir a parte antes da descrição
        const beforeDescriptionLines: string[] = [
            `# ${dto.role}`,
            `**🏢 Empresa:** ${dto.employer}`,
            `**💼 Tipo de contrato:** ${dto.role_type}`,
        ];

        if (dto.salary) {
            beforeDescriptionLines.push(`**💰 Salário:** ${dto.salary}`);
        }

        if (dto.role_level) {
            beforeDescriptionLines.push(`**📈 Nível:** ${dto.role_level}`);
        }

        if (dto.locations.length > 0) {
            beforeDescriptionLines.push(`**📍 Localização:** ${dto.locations.join(', ')}`);
        }

        if (dto.model) {
            beforeDescriptionLines.push(`**🚗 Modelo:** ${dto.model}`);
        }

        // Construir a parte depois da descrição
        const afterDescriptionLines: string[] = [];

        if (dto.skills) {
            afterDescriptionLines.push(`**💻 Principais Skills:** ${dto.skills}`);
        }

        afterDescriptionLines.push(`*Publicado em: ${dto.pub_date} | Termina em: ${dto.end_date}*`);

        // Construir os botões
        const buttons: ButtonBuilder[] = [];

        if (dto.how_to_apply && dto.how_to_apply.length <= 512) {
            buttons.push(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Candidate-se aqui')
                    .setEmoji({ name: '📋' })
                    .setURL(dto.how_to_apply),
            );
        }

        if (dto.ref_link && dto.ref_link.length <= 512) {
            buttons.push(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Link da vaga')
                    .setEmoji({ name: '📎' })
                    .setURL(dto.ref_link),
            );
        }

        // Construir o payload da mensagem inicial com os botões
        const components =
            buttons.length > 0
                ? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
                : [];

        const beforeDescriptionContent = beforeDescriptionLines.join('\n');
        const afterDescriptionContent = afterDescriptionLines.join('\n');

        // Verifica quais servidores (guilds) estão associados aos clusters da vaga
        let guildIds: string[] = [];
        dto.clusters.map((cluster) => {
            const guilds = this.guildsRepository.getGuildIdsByCluster(cluster);
            if (guilds.length === 0) return;
            guildIds = [...guildIds, ...guilds];
        });

        // Envia a mensagem para cada servidor (guild) associado aos clusters da vaga
        for (const guildId of guildIds) {
            // Descobre a guild e o canal onde a mensagem será enviada
            const guild = await this.client.guilds.fetch(guildId);
            if (!guild) {
                console.warn(`Guild not found ${guildId}`);
                continue;
            }

            const channel = guild.channels.cache
                .values()
                .find(
                    (channel) =>
                        channel.type === ChannelType.GuildForum &&
                        channel.name === VACANCY_CHANNEL_NAME,
                ) as ForumChannel;
            if (!channel) {
                console.warn(
                    `Forum channel "${VACANCY_CHANNEL_NAME}" not found in guild ${guildId}`,
                );
                continue;
            }

            // Enviar a primeira mensagem com a parte antes da descrição
            const firstMessage = await channel.threads.create({
                name: `${dto.employer} - ${dto.role}`,
                message: {
                    content: beforeDescriptionContent,
                },
            });

            // Se há descrição, dividir em blocos e enviar
            if (dto.description) {
                const descriptionHeader = '**🎯 Descrição da vaga:**';
                const descriptionChunks = this.splitTextIntoChunks(
                    dto.description,
                    2000 - descriptionHeader.length - 10,
                );

                for (const [index, chunk] of descriptionChunks.entries()) {
                    // Adiciona o header apenas no primeiro chunk
                    const content = index === 0 ? `${descriptionHeader}\n${chunk}` : chunk;
                    await firstMessage.send(content);
                }
            }

            // Enviar a parte depois da descrição com os botões
            const finalPayload: {
                content?: string;
                components?: ActionRowBuilder<ButtonBuilder>[];
            } = {};

            if (afterDescriptionContent) {
                finalPayload.content = `\n${afterDescriptionContent}`;
            }

            if (components.length > 0) {
                finalPayload.components = components as ActionRowBuilder<ButtonBuilder>[];
            }

            if (Object.keys(finalPayload).length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await firstMessage.send(finalPayload as any);
            }
        }
    }

    /**
     * Envia uma mensagem de aviso com menção ao cargo (role)
     * Usado para anúncios importantes que precisam de atenção do cargo
     */
    async sendWarning(dto: SendWarningDto): Promise<void> {
        // Substituir o marcador de posição pela menção real ao cargo
        const messageContent = dto.message.replaceAll(ROLE_NAME_REPLACEMENT, `${dto.role}`);
        await dto.channel.send(messageContent);
    }

    /**
     * Envia uma enquete de feedback de transmissão ao vivo com limitação de frequência (rate-limit)
     * Só envia se tiverem passado 5 minutos desde a última mensagem no canal
     * Exclui automaticamente após 5 minutos
     */
    async sendLivestreamPoll(targetChannel: TextChannel, role: Role): Promise<void> {
        const lastSent = this.sentWarnings.get(targetChannel.id);
        const now = Date.now();

        // Limitação de frequência: só envia se tiverem passado 5 minutos
        if (lastSent && now - lastSent < FIVE_MINUTES_IN_MILLISECONDS) {
            return;
        }

        this.sentWarnings.set(targetChannel.id, now);

        // Enviar mensagem de solicitação de feedback
        let message = await targetChannel.send(
            'Fala, turma! E aí, o que acharam da live?\n' +
                '\n' +
                'Enquanto o conteúdo ainda está fresco na memória, queremos muito saber a sua opinião!\n' +
                'Preencha o formulário abaixo e nos ajude a criar encontros cada vez mais incríveis. Contamos com você!\n' +
                '\n' +
                'Link do formulário: https://forms.gle/dFJAUdijQ6jUeZbr6\n' +
                `${role}`,
        );

        // Exclusão automática após 5 minutos
        setTimeout(async () => {
            try {
                message = await message.fetch();
                if (message && message.deletable) {
                    await message.delete();
                }
            } catch {
                // A mensagem pode já ter sido excluída
            }
        }, FIVE_MINUTES_IN_MILLISECONDS);
    }

    /**
     * Envia uma mensagem de boas-vindas com o avatar do usuário e estilo personalizado
     * Usa canvas para criar uma imagem de boas-vindas com a marca
     */
    async sendWelcomeMessage(dto: SendWelcomeMessageDto): Promise<void> {
        // Carregar imagem de fundo uma vez e colocá-la em cache
        if (!this.background) {
            this.background = await loadImage(path.join(process.cwd(), 'assets/wallpaper.png'));
        }

        // Criar canvas para a imagem de boas-vindas
        const canvas = createCanvas(1401, 571);
        const context = canvas.getContext('2d');

        // Buscar o avatar do usuário
        const avatarUrl = dto.profile.displayAvatarURL({ extension: 'png', size: 512 });
        const { body } = await request(avatarUrl);
        const avatarBuffer = Buffer.from(await body.arrayBuffer());
        const avatar = await loadImage(avatarBuffer);

        // Insere o fundo e corta a foto de perfil do usuário em formato de círculo
        context.drawImage(this.background, 0, 0, canvas.width, canvas.height);
        context.save();
        context.beginPath();
        context.arc(285, 285, 256, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();
        context.drawImage(avatar, 29, 29, 512, 512);
        context.restore();

        // Insere uma mensagem de boas-vindas que utiliza o nome do usuário
        context.font = '150px normalFont';
        context.fillStyle = '#ffffff';
        context.fillText('Bem vindo!', 512 + 100, (canvas.height - 150 + 150) / 2);
        context.fillText(
            `${dto.profile.displayName}`,
            512 + 100,
            (canvas.height - 150 + 150) / 2 + 150,
        );

        const pngBuffer = Buffer.from(await canvas.encode('png'));
        const attachment = new AttachmentBuilder(pngBuffer, { name: 'profile-image.png' });

        const initialComponents = [
            {
                type: ComponentType.Container,
                accent_color: null,
                spoiler: false,
                components: [
                    {
                        type: ComponentType.TextDisplay,
                        content: `### Olá, ${dto.profile}!\n### Bem vindo a nossa Comunidade Pos Tech!`,
                    },
                    {
                        type: ComponentType.MediaGallery,
                        items: [
                            {
                                media: {
                                    url: 'attachment://profile-image.png',
                                },
                                description: null,
                                spoiler: false,
                            },
                        ],
                    },
                ],
            },
        ];

        const sentMessage = await dto.targetChannel.send({
            components: initialComponents,
            flags: MessageFlags.IsComponentsV2,
            files: [attachment],
        });

        if (
            !this.featureFlagsService.isEnabled(
                dto.profile.guild.id,
                'botao_compartilhar_no_linkedin',
            )
        )
            return;

        Bun.sleep(3000);

        const discordImageUrl = sentMessage.components[0]!.components[1].items[0].media.url;

        console.debug('Imagem de boas vindas: ' + discordImageUrl);

        if (!discordImageUrl) {
            console.error('Falha ao obter a URL da CDN do Discord');
            return;
        }

        const shareLink = await this.linkedinService.sharePostOnLinkedin(discordImageUrl);

        const updatedComponents = [...initialComponents];

        updatedComponents[0]!.components.push({
            type: ComponentType.ActionRow,
            components: [
                {
                    type: ComponentType.Button,
                    style: ButtonStyle.Link,
                    label: 'Compartilhar no Linkedin',
                    emoji: null,
                    disabled: false,
                    url: shareLink,
                },
            ],
        });

        await sentMessage.edit({ components: updatedComponents });
    }
}
