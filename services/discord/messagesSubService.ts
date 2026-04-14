import type {IDiscordMessageService} from "../../types/discord.interfaces.ts";
import {AttachmentBuilder, Client, MessageFlags, PollLayoutType, Role, TextChannel, ComponentType, ButtonStyle} from "discord.js";
import {createCanvas, Image, loadImage} from "@napi-rs/canvas";
import path from "node:path";
import {request} from "undici";
import type {BroadcastMessageDto} from "../../dtos/broadcastMessage.dto.ts";
import type SendWarningDto from "../../dtos/sendWarning.dto.ts";
import type SendWelcomeMessageDto from "../../dtos/sendWelcomeMessage.dto.ts";
import type {PollMessageDto} from "../../dtos/pollMessage.dto.ts";
import LinkedinService from "../linkedinService.ts";
import {ROLE_NAME_REPLACEMENT} from "../../constants/discordConstants.ts";
import {FIVE_MINUTES_IN_MILLISECONDS} from "../../constants/globalConstants.ts";
import type FeatureFlagsService from "../featureFlagsService.ts";

export default class MessagesSubService implements IDiscordMessageService {
    private background: Image | null = null
    private sentWarnings: Map<string, number> = new Map()

    constructor(private client: Client, private linkedinService: LinkedinService, private FeatureFlagsService: FeatureFlagsService){}

    async createPoll(dto: PollMessageDto): Promise<void> {
        await dto.channel.send({
            poll: {
                question: dto.question,
                answers: dto.options,
                allowMultiselect: dto.allowMultiSelect,
                duration: dto.duration,
                layoutType: PollLayoutType.Default
            }
        });
    }

    async broadcast(dto: BroadcastMessageDto): Promise<void> {
        const payload = {
            content: dto.content.replaceAll(String.raw`\n`, '\n'),
            files: dto.files,
        };

        if (dto.onlyTargetChannel) {
            await dto.targetChannel.send(payload)
            return;
        }

        // envia para todos os canais com mesmo nome em todos os servidores
        await Promise.all(
            [...this.client.guilds.cache.values()].flatMap((guild) =>
                [...guild.channels.cache.filter((channel) => channel.name === dto.targetChannel.name).values()]
                    .filter((channel) => channel.isTextBased())
                    .map((channel) => channel.send(payload))
            )
        );
    }

    async sendWarning(dto: SendWarningDto): Promise<void> {
        await dto.channel.send(dto.message.replaceAll(ROLE_NAME_REPLACEMENT, `${dto.role}`))
    }

    async sendLivestreamPoll(targetChannel: TextChannel, role: Role): Promise<void> {
        const lastSent = this.sentWarnings.get(targetChannel.id);
        const now = Date.now();

        if (lastSent && now - lastSent < FIVE_MINUTES_IN_MILLISECONDS) return

        this.sentWarnings.set(targetChannel.id, now);

        let message = await targetChannel.send("Fala, turma! E aí, o que acharam da live?\n" +
            "\n" +
            "Enquanto o conteúdo ainda está fresco na memória, queremos muito saber a sua opinião!\n" +
            "Preencha o formulário abaixo e nos ajude a criar encontros cada vez mais incríveis. Contamos com você!\n" +
            "\n" +
            "Link do formulário: https://forms.gle/dFJAUdijQ6jUeZbr6\n" +
            `${role}`
        )

        setTimeout(async () => {
            message = await message.fetch()
            if (message && message.deletable) await message.delete()
        }, FIVE_MINUTES_IN_MILLISECONDS)
    }

    async sendWelcomeMessage(dto: SendWelcomeMessageDto): Promise<void> {
        if (!this.background) {
            this.background = await loadImage(path.join(process.cwd(), "assets/wallpaper.png"));
        }

        const canvas = createCanvas(1401, 571);
        const context = canvas.getContext('2d');

        // Cria um buffer com a imagem do usuário
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
        context.fillText('Bem vindo!', 512+100, (canvas.height - 150+150)/2);
        context.fillText(`${dto.profile.displayName}`, 512+100, (canvas.height - 150+150)/2+150);

        const pngBuffer = Buffer.from(await canvas.encode('png'));
        const attachment = new AttachmentBuilder(pngBuffer, { name: 'profile-image.png' });
        
        const initialComponents = [
            {
                "type": ComponentType.Container,
                "accent_color": null,
                "spoiler": false,
                "components": [
                    {
                        "type": ComponentType.TextDisplay,
                        "content": `### Olá, ${dto.profile}!\n### Bem vindo a nossa Comunidade Pos Tech!`
                    },
                    {
                        "type": ComponentType.MediaGallery,
                        "items": [
                            {
                                "media": {
                                    "url": "attachment://profile-image.png"
                                },
                                "description": null,
                                "spoiler": false
                            }
                        ]
                    }
                ]
            }
        ];

        const sentMessage = await dto.targetChannel.send({
            components: initialComponents,
            flags: MessageFlags.IsComponentsV2,
            files: [attachment]
        });

        if (!this.FeatureFlagsService.isEnabled(dto.profile.guild.id, 'botao_compartilhar_no_linkedin')) return

        Bun.sleep(3000)

        const discordImageUrl = sentMessage.components[0]!.components[1].items[0].media.url

        console.debug("Imagem de boas vindas: " + discordImageUrl)

        if (!discordImageUrl) {
            console.error("Falha ao obter a URL da CDN do Discord");
            return;
        }

        const shareLink = await this.linkedinService.sharePostOnLinkedin(discordImageUrl);

        const updatedComponents = [...initialComponents];

        updatedComponents[0]!.components.push({
            "type": ComponentType.ActionRow,
            "components": [
                {
                    "type": ComponentType.Button,
                    "style": ButtonStyle.Link,
                    "label": "Compartilhar no Linkedin",
                    "emoji": null,
                    "disabled": false,
                    "url": shareLink
                }
            ]
        });

        await sentMessage.edit({components: updatedComponents});
    }
}