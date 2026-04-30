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
} from 'discord.js';
import { createCanvas, Image, loadImage } from '@napi-rs/canvas';
import path from 'node:path';
import { request } from 'undici';
import type { BroadcastMessageDto } from '../../dtos/broadcastMessage.dto.ts';
import type SendWarningDto from '../../dtos/sendWarning.dto.ts';
import type SendWelcomeMessageDto from '../../dtos/sendWelcomeMessage.dto.ts';
import type { PollMessageDto } from '../../dtos/pollMessage.dto.ts';
import { ROLE_NAME_REPLACEMENT } from '../../constants/discordConstants.ts';
import { FIVE_MINUTES_IN_MILLISECONDS } from '../../constants/globalConstants.ts';

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
 *
 * Padrão de Projeto (Design Pattern): Injeção de Dependência através do construtor
 * Depende apenas do Client, não de serviços de lógica de negócio
 * Isso permite testes isolados e baixo acoplamento
 *
 * SOLID:
 * - Responsabilidade Única (Single Responsibility): Apenas lida com mensagens
 * - Inversão de Dependência (Dependency Inversion): Depende de tipos do Discord.js, não de lógica de negócio
 * - Aberto/Fechado (Open/Closed): Pode ser estendido para novos tipos de mensagens
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

    constructor(
        private client: Client,
        private featureFlagsService: IFeatureFlagsService,
        private linkedinService: ILinkedInService,
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
