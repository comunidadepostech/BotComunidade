var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Events, MessageFlags } from "discord.js";
import logger from "../../utils/logger.js";
export class InteractionCreate {
    constructor(bot) {
        this.name = Events.InteractionCreate;
        this.once = false;
        this.bot = bot;
    }
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!interaction.isCommand())
                return;
            const command = this.bot.commands.get(interaction.commandName);
            if (!this.bot.flags[interaction.guildId][command.name] && !command.alwaysEnabled) {
                yield interaction.reply({ content: "❌ Este comando está desabilitado neste servidor.", flags: MessageFlags.Ephemeral });
                return;
            }
            try {
                yield command.execute(interaction);
                logger.command(`Comando ${interaction.commandName} executado por ${interaction.user.username} em ${interaction.guild.name}`);
            }
            catch (error) {
                logger.error(`Erro ao executar o comando ${interaction.commandName}: ${error}`);
            }
        });
    }
}
