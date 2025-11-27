import {Events} from "discord.js";
import crypto from "node:crypto";

export class MessageUpdate {
    constructor(bot){
        this.name = Events.MessageUpdate;
        this.once = false;
        this.bot = bot
    }

    async execute(interaction){
        if (!interaction.poll) return

        if (!this.bot.flags[interaction.guild.id]["savePolls"]) return

        if (interaction.poll.resultsFinalized) {
            const now = Date.now(); // 3 horas antes (GMT-3), momento em que a enquete terminou
            const expirity = new Date(interaction.poll.expiresTimestamp);

            let className = await this.bot.client.channels.fetch(interaction.channelId);
            className = className.name

            let guildName = await this.bot.client.guilds.fetch(interaction.guild.id)
            guildName = guildName.name

            // Prepara o body para ser enviado para o n8n
            let body = {
                created_by: interaction.author.globalName,
                guild: guildName,
                poll_category: className,
                poll_hash: crypto.createHash('sha1').update(interaction.poll.question.text).digest('hex'),
                question: interaction.poll.question.text, // a pergunta da enquete
                answers: interaction.poll.answers.map(answer => { // lista de respostas
                    return {response: answer.text, answers: answer.voteCount}
                }),
                duration: `${((now - expirity) / 1000 / 60 / 60).toFixed(0)}` // horas
            };

            await fetch(process.env.N8N_ENDPOINT + '/salvarEnquete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': process.env.N8N_TOKEN
                },
                body: JSON.stringify(body)
            })
        }
    }
}