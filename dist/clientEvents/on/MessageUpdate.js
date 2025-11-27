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
import crypto from "node:crypto";
export class MessageUpdate {
    constructor(bot) {
        this.name = Events.MessageUpdate;
        this.once = false;
        this.bot = bot;
    }
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!interaction.poll)
                return;
            if (!this.bot.flags[interaction.guild.id]["savePolls"])
                return;
            if (interaction.poll.resultsFinalized) {
                const now = Date.now(); // 3 horas antes (GMT-3), momento em que a enquete terminou
                const expirity = new Date(interaction.poll.expiresTimestamp);
                let className = yield this.bot.client.channels.fetch(interaction.channelId);
                className = className.name;
                let guildName = yield this.bot.client.guilds.fetch(interaction.guild.id);
                guildName = guildName.name;
                // Prepara o body para ser enviado para o n8n
                let body = {
                    created_by: interaction.author.globalName,
                    guild: guildName,
                    poll_category: className,
                    poll_hash: crypto.createHash('sha1').update(interaction.poll.question.text).digest('hex'),
                    question: interaction.poll.question.text, // a pergunta da enquete
                    answers: interaction.poll.answers.map(answer => {
                        return { response: answer.text, answers: answer.voteCount };
                    }),
                    duration: `${((now - expirity) / 1000 / 60 / 60).toFixed(0)}` // horas
                };
                yield fetch(process.env.N8N_ENDPOINT + '/salvarEnquete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'token': process.env.N8N_TOKEN
                    },
                    body: JSON.stringify(body)
                });
            }
        });
    }
}
