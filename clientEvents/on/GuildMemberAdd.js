import { createCanvas, loadImage } from "@napi-rs/canvas";
import { request } from "undici";
import { AttachmentBuilder, Events } from "discord.js";

export class GuildMemberAdd {
    constructor(bot) {
        this.name = Events.GuildMemberAdd;
        this.once = false;
        this.background = loadImage("assets/wallpaper.png")
        this.bot = bot
    }

    // Constroi e envia uma imagem de boas-vindas
    async _sendWelcomeMessage(profile, targetChannel){
        const canvas = createCanvas(1401, 571);
        const context = canvas.getContext('2d');

        // Cria um buffer com a imagem do usuário
        const avatarUrl = profile.displayAvatarURL({ extension: 'png', size: 512 });
        const { body } = await request(avatarUrl);
        const avatarBuffer = Buffer.from(await body.arrayBuffer());
        const avatar = await loadImage(avatarBuffer);

        // Insere o fundo e corta a foto de perfil do usuário em formato de círculo
        context.drawImage(await this.background, 0, 0, canvas.width, canvas.height);
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

    async execute(member) {
        if (!this.bot.flags[member.guild.id]["sendWelcomeMessage"]) return;

        const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === "✨│boas-vindas");

        if (welcomeChannel) {
            await this._sendWelcomeMessage(member, welcomeChannel);
        }
    }
}
