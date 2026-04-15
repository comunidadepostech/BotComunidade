import DatabaseFlagsRepository from "../repositories/database/databaseFlagsRepository.ts";
import type {ICommand, ICommandContext, IRawPacket} from "../types/discord.interfaces.ts"
import {
    BaseInteraction, Client, Guild, GuildMember, PollAnswer, Message, TextChannel, ChannelType, Role, CategoryChannel, ForumChannel
} from "discord.js";
import type {PartialPollAnswer, GuildBasedChannel} from "discord.js";
import FeatureFlagsService from "../services/featureFlagsService.ts";
import type {InteractionPayload, Poll} from "../dtos/n8n.dtos.ts";
import N8nService from "../services/n8nService.ts";
import {WELCOME_CHANNEL_NAME} from "../constants/discordConstants.ts";
import {SchedulerService} from "../services/schedulerService.ts";
import DiscordService from "../services/discordService.ts";
import generatePollHash from "../utils/generatePollHash.ts";

export default class DiscordController {
    constructor(
        private discordService: DiscordService,
        private schedulerService: SchedulerService,
        private featureFlagsService: FeatureFlagsService,
        private databaseFalgsRepository: DatabaseFlagsRepository,
        private n8nService: N8nService,
        private commands: ICommand[],
        private client: Client,
    ) {}

    public async handleGuildCreateEvent(guild: Guild): Promise<void> {
        console.log(`Bot adicionado ao servidor ${guild.name} com ID ${guild.id}`)
        await this.databaseFalgsRepository.saveDefaultFeatureFlags(guild.id)
        console.log((`Feature Flags do servidor ${guild.name} carregadas`));
    }

    public async handleClientReadyEvent(client: Client): Promise<void> {
        console.log(`Bot online - Id: ${client.user!.id} - Tag: ${client.user!.tag}`);
    }

    public async handleErrorEvent(error: Error): Promise<void> {
        console.error(`${error.stack}`);
    }

    public async handleMessageCreateEvent(message: Message): Promise<void> {
        if (
            !this.featureFlagsService.getFlag(message.guildId!, "salvar_interacoes") ||
            ![ChannelType.GuildText, ChannelType.PublicThread, ChannelType.GuildStageVoice, ChannelType.GuildVoice].includes(message.channel.type) // Filtra a origem das mensagens
        ) return;

        // Ignora mensagens do sistema, vazias, apenas menções, comandos ou threads automáticas
        if (
            message.author.system ||
            !message.content?.trim() ||
            message.content.match(/^<@!?\d+>$/) ||
            !message.guild
        ) return;

        // Descobre dados do canal
        const channel = await this.client.channels.fetch(message.channelId);

        if (!channel || channel.isDMBased() || channel.isVoiceBased()) return

        const channelParent = channel.parent
        if (!channelParent) return

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
            guild: message.guild.name,
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
            body.class = channelParent.name
        } else {
            body.thread = channel.name
            body.channel = (this.client.channels.cache.get(channelParent.id) as ForumChannel).name
            body.class = (
                this.client.channels.cache.get(
                    (this.client.channels.cache.get(
                        channel.parent.id
                    ) as ForumChannel).parent!.id
                ) as CategoryChannel).name
        }

        await this.n8nService.saveInteraction(body).catch((error) => console.error(`${error.message}\n${error.stack}`))
    }

    public async handleGuildMemberAddEvent(member: GuildMember): Promise<void> {
        if (!this.featureFlagsService.getFlag(member.guild.id!, "enviar_mensagem_de_boas_vindas")) return;

        const welcomeChannel: TextChannel = member.guild.channels.cache.find((channel: GuildBasedChannel): boolean => channel.name === WELCOME_CHANNEL_NAME) as TextChannel;

        if (!welcomeChannel) {
            console.warn(`Canal de boas vindas de ${member.guild.name} não encontrado, a mensagem de boas vindas de ${member.nickname} foi omitida.`)
            return
        }

        await this.discordService.messages.sendWelcomeMessage({targetChannel: welcomeChannel, profile: member});
    }

    public async handleInteractionCreateEvent(interaction: BaseInteraction): Promise<void> {
        if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return

        const context: ICommandContext = {
            featureFlagsService: this.featureFlagsService,
            client: this.client,
            commands: this.commands,
            schedulerService: this.schedulerService,
            discordService: this.discordService
        };

        const command = this.commands.find(c => c.build().name === interaction.commandName);
        if (command) {
            try {
                await command.execute(interaction, context);
            } catch (error) {
                console.error(error instanceof Error ? error.stack : error);
            }
            return;
        }

        console.error(
            `Comando não encontrado na lista de comandos nativos!\n
            Comando: ${interaction.commandName}\n
            Lista de comandos registrada: ${this.commands.map(command => command.build().name).join(', ')}`
        )
    }

    public async handleGuildDeleteEvent(guild: Guild): Promise<void> {
        await this.databaseFalgsRepository.deleteGuildFeatureFlags(guild.id)
    }

    public async handleRawEvent(packet: IRawPacket): Promise<void> {
        if (packet.t !== 'MESSAGE_UPDATE') return;

        const data = packet.d;

        if (!data.channel_id) return
        if (!data.id) return
        if (!this.featureFlagsService.getFlag(data.guild_id!, "salvar_enquetes")) return

        if (!data.poll || !data.poll.results || !data.poll.results.is_finalized) return

        try {
            const channel = await this.client.channels.fetch(data.channel_id) as TextChannel;
            if (!channel) return

            const message = await channel.messages.fetch(data.id);
            if (!message.guild || !message.poll) return

            const now = new Date();
            const expirity: number = new Date(message.poll.expiresTimestamp!).getTime();
            const className = channel.parent?.name;
            const guildName = message.guild.name;

            const payload: Poll = {
                created_by: message.author?.globalName ?? message.author!.username!,
                guild: guildName,
                poll_category: className!,
                poll_hash: generatePollHash(message.createdAt.getFullYear().toString(), message.createdAt.getMonth().toString(), message.poll.question.text!),
                question: message.poll.question.text!,
                answers: message.poll.answers.map((answer: PollAnswer | PartialPollAnswer) => {
                    return { response: answer.text!, answers: answer.voteCount }
                }),
                duration: `${((now.getTime() - expirity) / (1000 * 60 * 60)).toFixed(0)}`
            };

            await this.n8nService.savePoll(payload).catch((error) => error instanceof Error ? console.error(`${error.message}\n${error.stack}`) : console.error(`Erro desconhecido: ${JSON.stringify(error, null, 2)}`))

        } catch (error) {
            console.error(`Erro ao processar evento raw da enquete ${data.id}:`, error)
        }
    }
}