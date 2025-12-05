import { createCanvas, loadImage } from "@napi-rs/canvas";
import { request } from "undici";
import { AttachmentBuilder, TextChannel, Events, GuildBasedChannel, GuildMember } from "discord.js";
import Bot from "../../bot.js";
import path from 'node:path';

export default class GuildMemberAdd {
    bot: Bot
    name: string
    once: boolean
    background: any
    constructor(bot: Bot){
        this.name = Events.GuildMemberAdd;
        this.once = false;
        this.background = null
        this.bot = bot
    }

    // Constroi e envia uma imagem de boas-vindas
    async #sendWelcomeMessage(profile: GuildMember, targetChannel: TextChannel){
        this.background = await loadImage(path.join(__dirname, "../../assets/wallpaper.png"))
        
        const canvas = createCanvas(1401, 571);
        const context = canvas.getContext('2d');

        // Cria um buffer com a imagem do usuário
        const avatarUrl = profile.displayAvatarURL({ extension: 'png', size: 512 });
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
        context.fillText(`${profile.displayName}`, 512+100, (canvas.height - 150+150)/2+150);

        const pngBuffer = Buffer.from(await canvas.encode('png'));
        const attachment = new AttachmentBuilder(pngBuffer, { name: 'profile-image.png' });

        targetChannel.send({ content: `Olá, ${profile}! Estamos muito felizes que você entrou na nossa **Comunidade Pos Tech!**`, files: [attachment] });
    }

    async execute(member: GuildMember){
        if (!this.bot.flags[member.guild.id]["sendWelcomeMessage"]) return;

        const welcomeChannel: TextChannel = member.guild.channels.cache.find((channel: GuildBasedChannel): boolean => channel.name === "✨│boas-vindas") as TextChannel;

        if (welcomeChannel) {
            await this.#sendWelcomeMessage(member, welcomeChannel);
        }
    }
}
