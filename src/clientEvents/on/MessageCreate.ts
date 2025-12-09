import {Events, CategoryChannel, ChannelType, Message, Role, ForumChannel} from "discord.js";
import logger from "../../utils/logger.js";
import Bot from "../../bot.js";

export default class MessageCreate {
    name: string;
    once: boolean;
    bot: Bot;
    constructor(bot: Bot){
        this.name = Events.MessageCreate;
        this.once = false;
        this.bot = bot
    }

    async execute(interaction: Message){
        if (
            !this.bot.flags[interaction.guildId as string]["saveInteractions"] ||

            // Filtra a origem das mensagens
            ![ChannelType.GuildText, ChannelType.PublicThread, ChannelType.GuildStageVoice, ChannelType.GuildVoice].includes(interaction.channel.type)
        ) return;

        // Ignora mensagens do sistema, bots, webhooks, vazias, apenas menções, comandos ou threads automáticas
        if (
            interaction.author.system ||
            //interaction.author.bot ||
            //interaction.webhookId ||
            !interaction.content?.trim() ||
            interaction.content.match(/^<@!?\d+>$/) ||
            interaction.content.startsWith('/') ||
            !interaction.guild
        ) return;

        // Descobre dados do canal
        const channel: any = await this.bot.client.channels.fetch(interaction.channelId);

        // Descobre o servidor
        const guildName: string = (await this.bot.client.guilds.fetch(interaction.guildId as string))?.name;

        // Descobre o maior cargo do membro pela posição hierárquica
        const member = await interaction.guild.members.fetch(interaction.author.id);
        const roles = member.roles.cache.filter((role: Role) => role.id !== interaction.guild!.id);
        const sortedRoles = roles.sort((a: Role, b: Role) => b.position - a.position);

        // Verifica se há pelo menos um cargo
        const firstRole = sortedRoles.first();
        if (!firstRole) {
            logger.warn(`Cargo do membro não encontrado, ignorando interação em ${interaction.guildId}`);
            return;
        }

        // Descobre o horário da mensagem
        const localTime = new Date(interaction.createdTimestamp).toISOString();

        interface Body {
            createdBy: string;
            guild: string;
            message: string;
            timestamp: string;
            id: string;
            authorRole: string;
            thread: string | null;
            channel: string | null;
            class: string | null;
        }

        const body: Body = {
            createdBy: interaction.author.globalName || 'Usuário desconhecido',
            guild: guildName,
            message: interaction.content,
            timestamp: localTime,
            id: interaction.id,
            authorRole: firstRole.name,
            thread: null,
            channel: null,
            class: null
        };

        if ([ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(interaction.channel.type)) {
            body.channel = channel.name
            body.class = channel.parent?.name
        } else {
            body.thread = channel.name
            body.channel = (this.bot.client.channels.cache.get(channel.parentId) as ForumChannel).name
            body.class = (
                this.bot.client.channels.cache.get(
                    (this.bot.client.channels.cache.get(
                        channel.parent.id
                    ) as ForumChannel).parent!.id
                ) as CategoryChannel).name
        }

        const response = await fetch(process.env.N8N_ENDPOINT + '/salvarInteracao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': process.env.N8N_TOKEN ?? ""
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            logger.error(`N8N endpoint não acessível: ${response.status} ${response.statusText}`);
        }
    }
}
