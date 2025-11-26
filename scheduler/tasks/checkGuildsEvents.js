import logger from "../../utils/logger.js";

export default class CheckGuildsEvents {
    constructor(bot) {
        this.events = new Map()
        this.maxCacheSize = Number(process.env.MAX_EVENTS_CACHE);
        this.bot = bot
        this.name = import.meta.url.split('/').pop().replace('.js', '')
        this.announcementChannelName = "🚨│avisos"
    }

    #formatMessage(event, classRole) {
        const date = new Date(event.scheduledStartTimestamp);
        const hours = date.toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit"
        });

        return `Boa noite, turma!! ${classRole ? classRole.toString() : ""}\n\n` +
            `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
            `acesse o card do evento [aqui](${event.url})`;
    }

    async #findClassRole(channel) {
        const parentName = channel.parent?.name;
        if (!parentName) return null;

        const overwrites = channel.permissionOverwrites.cache.filter(o => o.type === 0); // Type 0 is for roles
        const rolesPromises = overwrites.map(async o => {
            const role = await channel.guild.roles.fetch(o.id).catch(() => null); // Use channel.guild to fetch role
            return role?.name?.includes("Estudantes " + parentName) ? role : null;
        });
        const roles = await Promise.all(rolesPromises);
        return roles.find(r => r !== null) || null;
    }

    async #sendReminder(event, targetChannel) {
        if (!targetChannel?.isTextBased()) return;

        const classRole = await this.#findClassRole(targetChannel);
        const message = this.#formatMessage(event, classRole);

        await targetChannel.send(message);
    }

    async #processGuild(now, partialGuild) {
        try {
            if (!this.bot.flags[partialGuild.id]['checkEvents']) {
                logger.warn(`Avisos de ${partialGuild.name} ignorados`);
                return;
            }

            const guild = await partialGuild.fetch();
            const [events, channels] = await Promise.all([
                guild.scheduledEvents.fetch(),
                guild.channels.fetch()
            ]);

            await Promise.allSettled(Array.from(events.values()).map(this.#processEvent.bind(this, now, channels)));
        } catch (err) {
            logger.error(`Erro ao buscar eventos da guild ${partialGuild.id}: ${err}`);
        }
    }

    async #processEvent(now, channels, event) {
        const diffMinutes = Math.floor((event.scheduledStartTimestamp - now) / 1000 / 60);

        const isEventDue = diffMinutes > 0 && diffMinutes <= process.env.EVENT_DIFF_FOR_WARNING;
        const isEventNotCached = !this.events.has(event.id);

        if (isEventDue && isEventNotCached) {
            await this.#handleEventReminder(event, channels);
            this.#updateEventCache(event.id);
        }
    }

    async #handleEventReminder(event, channels) {
        if (event.channelId === null) {
            const avisoChannels = channels.filter(c => c.type === 0 && c.name === this.announcementChannelName);
            await Promise.allSettled(avisoChannels.map(channel => this.#sendReminder(event, channel)));
        } else {
            const eventChannel = channels.get(event.channelId);
            if (!eventChannel) throw new Error(`Canal de evento não encontrado: ${event.channelId}`);

            const targetChannel = channels.find(
                c => c.parentId === eventChannel.parentId && c.name === this.announcementChannelName
            );
            if (!targetChannel) throw new Error(`Canal de aviso não encontrado: ${this.announcementChannelName}`);

            await this.#sendReminder(event, targetChannel);
        }
    }

    #updateEventCache(eventId) {
        this.events.set(eventId, true);
        if (this.events.size > this.maxCacheSize) {
            const firstKey = this.events.keys().next().value;
            this.events.delete(firstKey);
        }
    }

    async execute() {
        const guilds = this.bot.client.guilds.cache;
        const now = Date.now();

        // Processa todos os servidores em paralelo
        try {
            await Promise.allSettled(Array.from(guilds.values()).map(this.#processGuild.bind(this, now)));
        } catch (error) {
            throw new Error(`Erro ao processar evento: ${error}`);
        }

    }
}
