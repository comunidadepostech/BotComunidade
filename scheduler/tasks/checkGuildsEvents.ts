import logger from "../../utils/logger.ts";
import Bot from "../../bot.ts";
import {
    Guild,
    OverwriteResolvable,
    TextChannel,
    GuildScheduledEvent,
    Role,
    Channel,
    Collection,
    ChannelType,
    VoiceChannel,
    GuildScheduledEventStatus,
    Message
} from "discord.js";
import StudyGroupAnalysis from "./studyGroupAnalysis.ts";
import safeSetTimeout from "../../utils/safeTimeout.ts";

export default class CheckGuildsEvents {
    bot: Bot
    events: Map<string, boolean>
    maxCacheSize: number
    name: string
    announcementChannelName: string
    studyGroupAnalysis: StudyGroupAnalysis
    constructor(bot: Bot) {
        this.events = new Map()
        this.maxCacheSize = Number(process.env.MAX_EVENTS_CACHE);
        this.bot = bot
        this.name = import.meta.url.split('/').pop()!.replace('.js', '')
        this.announcementChannelName = "🚨│avisos"
        this.studyGroupAnalysis = new StudyGroupAnalysis(bot)
    }

    private formatMessage(event: GuildScheduledEvent, classRole: Role) {
        const date = new Date(event.scheduledStartTimestamp as number);
        const hours = date.toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            hour: "2-digit",
            minute: "2-digit"
        });

        return `Boa noite, turma!! ${classRole ? classRole.toString() : ""}\n\n` +
            `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
            `acesse o card do evento [aqui](${event.url})`;
    }

    private async findClassRole(channel: TextChannel): Promise<Role | null>{
        const parentName = channel.parent?.name;
        if (!parentName) return null;

        const overwrites = channel.permissionOverwrites.cache.filter((overwrite: OverwriteResolvable) => overwrite.type === 0);
        const rolesPromises = overwrites.map(async (roleOverwrite) => {
            const role = await channel.guild.roles.fetch(roleOverwrite.id);
            return role?.name?.includes("Estudantes " + parentName) ? role : null;
        });
        const roles = await Promise.all(rolesPromises);
        return roles.find(role => role !== null) || null;
    }

    private async sendReminder(event: GuildScheduledEvent, targetChannel: TextChannel): Promise<Message | undefined> {
        if (!targetChannel?.isTextBased()) return;

        const classRole = await this.findClassRole(targetChannel);
        const message = this.formatMessage(event, classRole!);

        return await targetChannel.send(message);
    }

    private async processGuild(now: number, partialGuild: Guild): Promise<void>{
        try {
            const guild = await partialGuild.fetch();
            const events = await guild.scheduledEvents.fetch()
            const channels = await guild.channels.fetch() as Collection<string, Channel>

            if (!this.bot.flags[partialGuild.id]['checkEvents']) {
                logger.warn(`Avisos de ${partialGuild.name} ignorados`);
                await Promise.allSettled(Array.from(events.values()).map(this.processEvent.bind(this, now, channels, false)));
                return;
            }

            await Promise.allSettled(Array.from(events.values()).map(this.processEvent.bind(this, now, channels, true)));
        } catch (err) {
            logger.error(`Erro ao buscar eventos da guild ${partialGuild.id}: ${err}`);
        }
    }

    private async processEvent(now: number | null, channels: Collection<string, Channel> | null, sendReminder: boolean, event: GuildScheduledEvent): Promise<void> {
        if (sendReminder) {
            // Parte para o envio do aviso
            const diffMinutes = Math.floor((event.scheduledStartTimestamp as number - now!) / 1000 / 60);

            const isEventDue = diffMinutes > 0 && diffMinutes <= Number(process.env.EVENT_DIFF_FOR_WARNING);
            const isEventNotCached = !this.events.has(event.id);

            if (isEventDue && isEventNotCached) {
                await this.handleEventReminder(event, channels!);
                this.updateEventCache(event.id);
            }
        }

        // Inicia o evento quando der o horário e termina-o quando acabar
        if (event.name.split(" - ").length === 2 && this.studyGroupAnalysis.possibleNames.includes(event.name.split(" - ")[1]!)) { // Remover isso faz o TS reclamar de null
            const now = Date.now();
            const eventStartTime = event.scheduledStartTimestamp as number;
            const eventEndTime = event.scheduledEndTimestamp as number;

            const shouldStart = now >= eventStartTime && event.status !== GuildScheduledEventStatus.Completed;
            const hasNotStarted = !this.events.has(`${event.id}-started`);

            if (shouldStart && hasNotStarted) {
                await event.setStatus(GuildScheduledEventStatus.Active);
                this.updateEventCache(`${event.id}-started`);
            }

            const shouldEnd = now >= eventEndTime || (now - eventStartTime) > 3 * 60 * 60 * 1000;
            const hasNotEnded = !this.events.has(`${event.id}-ended`);

            if (shouldEnd && hasNotEnded) {
                await event.setStatus(GuildScheduledEventStatus.Completed);
            }
        }

        // Parte para o envio do evento para uma classe externa que usa a mesma propriedade de verificação de eventos (reaproveita parte do código) e verifica a flag
        if (!this.bot.flags[event.guild!.id]['collectStudyGroupAnalysis']) {
            //logger.warn(`Envios de dados de Grupo de estudos de ${event.guild!.name} ignorados`);
            return
        }

        await this.studyGroupAnalysis.execute(event)
    }

    private async handleEventReminder(event: GuildScheduledEvent, channels: Collection<string, Channel>) {
        if (event.channelId === null) {
            const avisoChannels = channels.filter(c => c.type === 0 && c.name === this.announcementChannelName);
            await Promise.allSettled(avisoChannels.map((channel) => this.sendReminder(event, channel as TextChannel)));
        } else {
            const eventChannel = channels.get(event.channelId) as VoiceChannel; // Sempre é um canal de voz
            if (!eventChannel) throw new Error(`Canal de evento não encontrado: ${event.channelId}`);

            const targetChannel = channels.find(
                (channel) => channel.type === ChannelType.GuildText && channel.parentId === eventChannel.parentId && channel.name === this.announcementChannelName
            );
            if (!targetChannel) throw new Error(`Canal de aviso não encontrado: ${this.announcementChannelName}`);

            const reminder = await this.sendReminder(event, targetChannel as TextChannel);
            if (reminder) safeSetTimeout(async () => await reminder.delete(), 5 * 60 * 60 * 1000) // Deleta a mensagem após 1 hora
        }
    }

    private updateEventCache(eventId: string) {
        this.events.set(eventId, true);
        if (this.events.size > this.maxCacheSize) {
            const firstKey: string = this.events.keys().next().value!;
            this.events.delete(firstKey);
        }
    }

    public async execute() {
        const guilds = this.bot.client.guilds.cache;
        const now = Date.now();

        // Processa todos os servidores em paralelo
        try {
            await Promise.allSettled(Array.from(guilds.values()).map(this.processGuild.bind(this, now)));
        } catch (error) {
            throw new Error(`Erro ao processar evento: ${error}`);
        }
    }
}
