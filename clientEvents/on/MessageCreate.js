import {Events} from "discord.js";

export class MessageCreate {
    constructor(bot){
        this.name = Events.MessageCreate;
        this.once = false;
        this.bot = bot
    }

    async execute(interaction){
        if (!this.bot.flags[interaction.guildId]["saveInteractions"] ||

            // Filtra a origem das mensagens
            ![0, 11, 2, 13].includes(interaction.type) ||

            // Ignora mensagens de bots
            interaction.author.bot ||

            // Ignora mensagens vazias (sem conteúdo de texto)
            !interaction.content || interaction.content.trim() === '' ||

            // Ignora webhooks
            interaction.webhookId ||

            // Ignora mensagens com apenas menções
            !interaction.content.match(/^<@!?\d+>$/) ||

            // Ignora comandos (mensagens que começam com /)
            interaction.content.startsWith('/') ||

            // Ignora mensagens de threads automáticas
            packet.d.flags && (packet.d.flags & 32)
        ) return

        // Descobre dados do canal
        const channel = await this.bot.client.channels.fetch(interaction.guildId);

        // Descobre o servidor
        let guildName = await this.bot.client.guilds.fetch(interaction.guildId);
        guildName = guildName.name;

        // Descobre o maior cargo do membro pela posição hierárquica
        const member = await guild.members.fetch(interaction.author.id);
        const roles = member.roles.cache.filter(role => role.id !== guild.id);
        const sortedRoles = roles.sort((a, b) => b.position - a.position);

        // Verifica se há pelo menos um cargo
        const firstRole = sortedRoles.first();
        if (!firstRole) {
            console.log("LOG - Cargo do membro não encontrado, ignorando interação");
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
        body.channel = interaction.type !== ChannelType.GuildText ? channel.name : null;
        body.class = channel.parent
            ? (await this.bot.client.channels.fetch(channel.parent.id))?.name || null
            : null;

        const response = await fetch(process.env.N8N_ENDPOINT + '/salvarInteracao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': process.env.N8N_TOKEN
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error('ERRO - N8N endpoint não acessível:', response.status, response.statusText);
        }
    }
}