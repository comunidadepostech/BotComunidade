import DatabaseFlagsRepository from "../../repositories/database/databaseFlagsRepository.ts";
import {Command, CommandContext} from "../../entities/discordEntities.ts"
import {
    BaseInteraction, Client, Guild, GuildMember, PollAnswer, PartialPollAnswer, Message, PartialMessage, TextChannel, ChannelType, Role, CategoryChannel, ForumChannel, GuildBasedChannel
} from "discord.js";
import FeatureFlagsService from "../../services/FeatureFlagsService.ts";
import crypto from "node:crypto";
import {InteractionPayload, Poll} from "../../entities/dto/n8nDTOs.ts";
import N8nService from "../../services/n8nService.ts";
import {WELCOME_CHANNEL_NAME} from "../../constants/discordContants.ts";
import MessagingService from "../../services/messagingService.ts";

export default class discordController {
    constructor(
        private featureFlagsService: FeatureFlagsService,
        private messagingService: MessagingService,
        private commands: Command[],
        private client: Client,
    ) {}

    public async handleGuildCreateEvent(guild: Guild) {
        console.log(`Bot adicionado ao servidor ${guild.name} com ID ${guild.id}`)
        await DatabaseFlagsRepository.saveDefaultFeatureFlags(guild.id)
        console.log((`Feature Flags do servidor ${guild.name} carregadas`));
    }

    public async handleClientReadyEvent(client: Client) {
        console.log(`Bot online - Id: ${client.user!.id} - Tag: ${client.user!.tag}`);
    }

    public async handleErrorEvent(error: Error) {
        console.error(`${error.stack}`);
    }

    public async handleMessageCreateEvent(message: Message) {
        if (
            !this.featureFlagsService.flags[message.guildId!]!["salvar_interacoes"] ||
            ![ChannelType.GuildText, ChannelType.PublicThread, ChannelType.GuildStageVoice, ChannelType.GuildVoice].includes(message.channel.type) // Filtra a origem das mensagens
        ) return;

        // Ignora mensagens do sistema, vazias, apenas menções, comandos ou threads automáticas
        if (
            message.author.system ||
            !message.content?.trim() ||
            message.content.match(/^<@!?\d+>$/) ||
            message.content.startsWith('/') ||
            !message.guild
        ) return;

        // Descobre dados do canal
        const channel: any = await this.client.channels.fetch(message.channelId);

        // Descobre o servidor

        // Descobre o maior cargo do membro pela posição hierárquica
        const member = await message.guild.members.fetch(message.author.id);
        const roles = member.roles.cache.filter((role: Role) => role.id !== message.guild!.id);
        const sortedRoles = roles.sort((a: Role, b: Role) => b.position - a.position);

        // Verifica se há pelo menos um cargo
        const firstRole = sortedRoles.first();
        if (!firstRole) {
            console.warn(`Cargo do membro não encontrado, ignorando interação em ${message.guildId}`);
            return;
        }

        // Descobre o horário da mensagem
        const localTime = new Date(message.createdTimestamp).toISOString();

        const body: InteractionPayload = {
            createdBy: message.author.globalName || 'Usuário desconhecido',
            guild: guildName,
            message: message.content,
            timestamp: localTime,
            id: message.id,
            authorRole: firstRole.name,
            thread: null,
            channel: null,
            class: null
        };

        if ([ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(message.channel.type)) {
            body.channel = channel.name
            body.class = channel.parent?.name
        } else {
            body.thread = channel.name
            body.channel = (this.client.channels.cache.get(channel.parentId) as ForumChannel).name
            body.class = (
                this.client.channels.cache.get(
                    (this.client.channels.cache.get(
                        channel.parent.id
                    ) as ForumChannel).parent!.id
                ) as CategoryChannel).name
        }

        await N8nService.saveInteraction(body).catch((error: any) => console.error(`${error.message}\n${error.stack}`))
    }

    public async handleGuildMemberAddEvent(member: GuildMember) {
        if (!this.featureFlagsService.flags[member.guild.id!]!["enviar_mensagem_de_boas_vindas"]) return;

        const welcomeChannel: TextChannel = member.guild.channels.cache.find((channel: GuildBasedChannel): boolean => channel.name === WELCOME_CHANNEL_NAME) as TextChannel;

        if (!welcomeChannel) console.warn(`Canal de boas vindas de ${member.guild.name} não encontrado, a mensagem de boas vindas de ${member.nickname} foi omitida.`)

        await this.messagingService.sendWelcomeMessage(welcomeChannel, member);
    }

    public async handleInteractionCreateEvent(interaction: BaseInteraction) {
        if (!interaction.isChatInputCommand()) return

        const context: CommandContext = {
            featureFlagsService: this.featureFlagsService,
            client: this.client,
            commands: this.commands
        };

        for (const nativeCommand of this.commands) {
            if (nativeCommand.name === interaction.commandName) {
                await nativeCommand.execute(interaction, context);
                return
            }
        }

        console.error(`Comando não encontrado na lista de comandos nativos!\nComando: ${interaction.commandName}\nLista de comandos registrada: ${this.commands.map(command => command.name).join(', ')}`)
    }

    public async handleMessageUpdateEvent(_oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
        if (!this.featureFlagsService.flags[newMessage.guildId!]!["salvar_enquetes"]) return

        if (newMessage.partial) await newMessage.fetch();

        if (!newMessage.guild) return

        if (!newMessage.poll) return

        if (!newMessage.poll.resultsFinalized) return

        const now: number = Date.now(); // 3 horas antes (GMT-3), momento em que a enquete terminou
        const expirity: number = new Date(newMessage.poll.expiresTimestamp as number).getTime();
        const className = (this.client.channels.cache.get(newMessage.channel.id) as TextChannel).parent?.name;
        const guildName = (await this.client.guilds.fetch(newMessage.guild.id)).name

        // Prepara o body para ser enviado para o n8n
        let payload: Poll  = {
            created_by: newMessage.author?.globalName ?? newMessage.author?.username!,
            guild: guildName,
            poll_category: className!,
            poll_hash: crypto.createHash('sha1').update(newMessage.poll.question.text as string).digest('hex'),
            question: newMessage.poll.question.text!,
            answers: newMessage.poll.answers.map((answer: PollAnswer | PartialPollAnswer) => { // lista de respostas
                return {response: answer.text!, answers: answer.voteCount}
            }),
            duration: `${((now - expirity) / (1000 * 60 * 60)).toFixed(0)}` // horas
        };

        await N8nService.savePoll(payload).catch((error: any) => console.error(`${error.message}\n${error.stack}`))
    }

    public async handleGuildDeleteEvent(guild: Guild) {
        await DatabaseFlagsRepository.deleteGuildFeatureFlags(guild.id)
    }
}