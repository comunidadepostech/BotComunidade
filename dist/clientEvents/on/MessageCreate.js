var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ChannelType, Events } from "discord.js";
import logger from "../../utils/logger.js";
export class MessageCreate {
    constructor(bot) {
        this.name = Events.MessageCreate;
        this.once = false;
        this.bot = bot;
    }
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.bot.flags[interaction.guildId]["saveInteractions"] ||
                // Filtra a origem das mensagens
                ![0, 11, 2, 13].includes(interaction.type))
                return;
            // Ignora mensagens do sistema, bots, webhooks, vazias, apenas menções, comandos ou threads automáticas
            if (interaction.author.system ||
                interaction.author.bot ||
                interaction.webhookId ||
                !((_a = interaction.content) === null || _a === void 0 ? void 0 : _a.trim()) ||
                interaction.content.match(/^<@!?\d+>$/) ||
                interaction.content.startsWith('/'))
                return;
            // Descobre dados do canal
            const channel = yield this.bot.client.channels.fetch(interaction.channelId);
            // Descobre o servidor
            let guildName = yield this.bot.client.guilds.fetch(interaction.guildId);
            guildName = guildName.name;
            // Descobre o maior cargo do membro pela posição hierárquica
            const member = yield interaction.guild.members.fetch(interaction.author.id);
            const roles = member.roles.cache.filter(role => role.id !== interaction.guild.id);
            const sortedRoles = roles.sort((a, b) => b.position - a.position);
            // Verifica se há pelo menos um cargo
            const firstRole = sortedRoles.first();
            if (!firstRole) {
                logger.warn(`Cargo do membro não encontrado, ignorando interação em ${interaction.guildId}`);
                return;
            }
            // Descobre o horário da mensagem
            const localTime = new Date(interaction.createdTimestamp).toISOString();
            const body = {
                createdBy: interaction.author.globalName || 'Usuário desconhecido',
                guild: guildName,
                message: interaction.content,
                timestamp: localTime,
                id: interaction.id,
                authorRole: firstRole.name
            };
            body.thread = interaction.type === ChannelType.GuildText ? channel.name : null;
            body.channel = interaction.type === ChannelType.GuildText ? null : channel.name;
            body.class = channel.parent
                ? ((_b = (yield this.bot.client.channels.fetch(channel.parent.id))) === null || _b === void 0 ? void 0 : _b.name) || null
                : null;
            const response = yield fetch(process.env.N8N_ENDPOINT + '/salvarInteracao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': process.env.N8N_TOKEN
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                logger.error('N8N endpoint não acessível:', response.status, response.statusText);
            }
        });
    }
}
