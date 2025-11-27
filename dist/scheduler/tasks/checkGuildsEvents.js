var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CheckGuildsEvents_instances, _CheckGuildsEvents_formatMessage, _CheckGuildsEvents_findClassRole, _CheckGuildsEvents_sendReminder, _CheckGuildsEvents_processGuild, _CheckGuildsEvents_processEvent, _CheckGuildsEvents_handleEventReminder, _CheckGuildsEvents_updateEventCache;
import logger from "../../utils/logger.js";
class CheckGuildsEvents {
    constructor(bot) {
        _CheckGuildsEvents_instances.add(this);
        this.events = new Map();
        this.maxCacheSize = Number(process.env.MAX_EVENTS_CACHE);
        this.bot = bot;
        this.name = import.meta.url.split('/').pop().replace('.js', '');
        this.announcementChannelName = "🚨│avisos";
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const guilds = this.bot.client.guilds.cache;
            const now = Date.now();
            // Processa todos os servidores em paralelo
            try {
                yield Promise.allSettled(Array.from(guilds.values()).map(__classPrivateFieldGet(this, _CheckGuildsEvents_instances, "m", _CheckGuildsEvents_processGuild).bind(this, now)));
            }
            catch (error) {
                throw new Error(`Erro ao processar evento: ${error}`);
            }
        });
    }
}
_CheckGuildsEvents_instances = new WeakSet(), _CheckGuildsEvents_formatMessage = function _CheckGuildsEvents_formatMessage(event, classRole) {
    const date = new Date(event.scheduledStartTimestamp);
    const hours = date.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit"
    });
    return `Boa noite, turma!! ${classRole ? classRole.toString() : ""}\n\n` +
        `Passando para lembrar vocês do nosso evento de hoje às ${hours} 🚀\n` +
        `acesse o card do evento [aqui](${event.url})`;
}, _CheckGuildsEvents_findClassRole = function _CheckGuildsEvents_findClassRole(channel) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const parentName = (_a = channel.parent) === null || _a === void 0 ? void 0 : _a.name;
        if (!parentName)
            return null;
        const overwrites = channel.permissionOverwrites.cache.filter(o => o.type === 0); // Type 0 is for roles
        const rolesPromises = overwrites.map((o) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const role = yield channel.guild.roles.fetch(o.id).catch(() => null); // Use channel.guild to fetch role
            return ((_a = role === null || role === void 0 ? void 0 : role.name) === null || _a === void 0 ? void 0 : _a.includes("Estudantes " + parentName)) ? role : null;
        }));
        const roles = yield Promise.all(rolesPromises);
        return roles.find(r => r !== null) || null;
    });
}, _CheckGuildsEvents_sendReminder = function _CheckGuildsEvents_sendReminder(event, targetChannel) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(targetChannel === null || targetChannel === void 0 ? void 0 : targetChannel.isTextBased()))
            return;
        const classRole = yield __classPrivateFieldGet(this, _CheckGuildsEvents_instances, "m", _CheckGuildsEvents_findClassRole).call(this, targetChannel);
        const message = __classPrivateFieldGet(this, _CheckGuildsEvents_instances, "m", _CheckGuildsEvents_formatMessage).call(this, event, classRole);
        yield targetChannel.send(message);
    });
}, _CheckGuildsEvents_processGuild = function _CheckGuildsEvents_processGuild(now, partialGuild) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!this.bot.flags[partialGuild.id]['checkEvents']) {
                logger.warn(`Avisos de ${partialGuild.name} ignorados`);
                return;
            }
            const guild = yield partialGuild.fetch();
            const [events, channels] = yield Promise.all([
                guild.scheduledEvents.fetch(),
                guild.channels.fetch()
            ]);
            yield Promise.allSettled(Array.from(events.values()).map(__classPrivateFieldGet(this, _CheckGuildsEvents_instances, "m", _CheckGuildsEvents_processEvent).bind(this, now, channels)));
        }
        catch (err) {
            logger.error(`Erro ao buscar eventos da guild ${partialGuild.id}: ${err}`);
        }
    });
}, _CheckGuildsEvents_processEvent = function _CheckGuildsEvents_processEvent(now, channels, event) {
    return __awaiter(this, void 0, void 0, function* () {
        const diffMinutes = Math.floor((event.scheduledStartTimestamp - now) / 1000 / 60);
        const isEventDue = diffMinutes > 0 && diffMinutes <= process.env.EVENT_DIFF_FOR_WARNING;
        const isEventNotCached = !this.events.has(event.id);
        if (isEventDue && isEventNotCached) {
            yield __classPrivateFieldGet(this, _CheckGuildsEvents_instances, "m", _CheckGuildsEvents_handleEventReminder).call(this, event, channels);
            __classPrivateFieldGet(this, _CheckGuildsEvents_instances, "m", _CheckGuildsEvents_updateEventCache).call(this, event.id);
        }
    });
}, _CheckGuildsEvents_handleEventReminder = function _CheckGuildsEvents_handleEventReminder(event, channels) {
    return __awaiter(this, void 0, void 0, function* () {
        if (event.channelId === null) {
            const avisoChannels = channels.filter(c => c.type === 0 && c.name === this.announcementChannelName);
            yield Promise.allSettled(avisoChannels.map(channel => __classPrivateFieldGet(this, _CheckGuildsEvents_instances, "m", _CheckGuildsEvents_sendReminder).call(this, event, channel)));
        }
        else {
            const eventChannel = channels.get(event.channelId);
            if (!eventChannel)
                throw new Error(`Canal de evento não encontrado: ${event.channelId}`);
            const targetChannel = channels.find(c => c.parentId === eventChannel.parentId && c.name === this.announcementChannelName);
            if (!targetChannel)
                throw new Error(`Canal de aviso não encontrado: ${this.announcementChannelName}`);
            yield __classPrivateFieldGet(this, _CheckGuildsEvents_instances, "m", _CheckGuildsEvents_sendReminder).call(this, event, targetChannel);
        }
    });
}, _CheckGuildsEvents_updateEventCache = function _CheckGuildsEvents_updateEventCache(eventId) {
    this.events.set(eventId, true);
    if (this.events.size > this.maxCacheSize) {
        const firstKey = this.events.keys().next().value;
        this.events.delete(firstKey);
    }
};
export default CheckGuildsEvents;
