import {Events, TextChannel, Message, PartialMessage} from "discord.js";
import crypto from "node:crypto";
import Bot from "../../bot.js";
import logger from "../../utils/logger.js";


export default class MessageUpdate {
    name: string;
    once: boolean;
    bot: Bot;
    constructor(bot: Bot){
        this.name = Events.MessageUpdate;
        this.once = false;
        this.bot = bot
    }

    async execute(interaction: Message | PartialMessage): Promise<void>{
        if (!interaction.guild) return
        if (!interaction.poll) return

        if (!this.bot.flags[interaction.guild.id]["savePolls"]) return

        if (interaction.poll.resultsFinalized) {
            const now: number = Date.now(); // 3 horas antes (GMT-3), momento em que a enquete terminou
            const expirity: number = new Date(interaction.poll.expiresTimestamp as number).getTime();

            let className = (this.bot.client.channels.cache.get(interaction.channelId) as TextChannel).name;

            const guildName = (await this.bot.client.guilds.fetch(interaction.guild.id)).name

            // Prepara o body para ser enviado para o n8n
            let body = {
                created_by: interaction.author!.globalName,
                guild: guildName,
                poll_category: className,
                poll_hash: crypto.createHash('sha1').update(interaction.poll.question.text as string).digest('hex'),
                question: interaction.poll.question.text, // a pergunta da enquete
                answers: interaction.poll.answers.map(answer => { // lista de respostas
                    return {response: answer.text, answers: answer.voteCount}
                }),
                duration: `${((now - expirity) / 1000 / 60 / 60).toFixed(0)}` // horas
            };

            const res = await fetch(process.env.N8N_ENDPOINT + '/salvarEnquete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': process.env.N8N_TOKEN ?? ""
                },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                logger.error(`Falha ao enviar enquete para o n8n: ${res.status}`)
            }
        }
    }
}