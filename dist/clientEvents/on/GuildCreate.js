var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Events } from "discord.js";
import logger from "../../utils/logger.js";
export class GuildCreate {
    constructor(bot) {
        this.name = Events.GuildCreate; // O nome do evento
        this.once = false;
        this.bot = bot;
    }
    execute(guild) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log(`${this.bot.client.user.username} adicionado ao servidor ${guild.name} com ID ${guild.id}`);
            this.bot.flags[guild.id] = this.bot.defaultFlags;
            yield this.bot.db.getFlags(guild.id);
            logger.log(`Flags do servidor ${guild.name} carregadas`);
        });
    }
}
