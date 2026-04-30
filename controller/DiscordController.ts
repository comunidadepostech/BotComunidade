import type { ICommand, ICommandContext, IRawPacket } from '../types/discord.interfaces.ts';
import {
    BaseInteraction,
    Client,
    Guild,
    GuildMember,
    PollAnswer,
    Message,
    TextChannel,
    ChannelType,
    Role,
    CategoryChannel,
    ForumChannel,
} from 'discord.js';
import type { PartialPollAnswer, GuildBasedChannel } from 'discord.js';
import type { InteractionPayload, Poll } from '../dtos/n8n.dtos.ts';
import { WELCOME_CHANNEL_NAME } from '../constants/discordConstants.ts';
import generatePollHash from '../utils/generatePollHash.ts';
import type IDiscordController from '../types/discordController.interface.ts';
import type { IDiscordService } from '../types/discord.interfaces.ts';
import type ISchedulerService from '../types/schedulerService.interface.ts';
import type IFeatureFlagsService from '../types/featureFlagsService.interface.ts';
import type { IFlagsRepository } from '../types/repository.interfaces.ts';
import type IN8nService from '../types/n8nService.interface.ts';

/**
 * DiscordController - Controlador enxuto para eventos do Discord
 * Implementa a interface IDiscordController
 *
 * Responsabilidades:
 * - Roteia eventos do Discord para os serviços apropriados
 * - Delega a lógica de negócio para os serviços
 * - Mantém uma separação limpa de preocupações
 *
 * Princípios SOLID:
 * - Responsabilidade Única (Single Responsibility): Apenas lida com o roteamento de eventos
 * - Inversão de Dependência (Dependency Inversion): Depende de interfaces de serviço, não de implementações
 * - Segregação de Interface (Interface Segregation): Define explicitamente a interface IDiscordController
 *
 * Padrão (Pattern): Controlador como Roteador de Eventos
 * Os controladores devem ser enxutos e principalmente delegar para os serviços
 * A lógica de negócio pertence aos serviços, não aos controladores
 */
export default class DiscordController implements IDiscordController {
    constructor(
        private discordService: IDiscordService,
        private schedulerService: ISchedulerService,
        private featureFlagsService: IFeatureFlagsService,
        private flagsRepository: IFlagsRepository,
        private n8nService: IN8nService,
        private commands: ICommand[],
        private client: Client,
    ) {}

    /**
     * Lida com o evento de criação de servidor (guild)
     * Chamado quando o bot é adicionado a um novo servidor
     * Inicializa as flags de funcionalidade padrão para o servidor
     */
    async handleGuildCreateEvent(guild: Guild): Promise<void> {
        console.log(`Bot added to guild: ${guild.name} (ID: ${guild.id})`);
        await this.flagsRepository.saveDefaultFeatureFlags(guild.id);
        console.log(`Feature flags initialized for guild: ${guild.name}`);
    }

    /**
     * Lida com o evento de cliente pronto (ready)
     * Chamado quando o bot se conecta com sucesso ao Discord
     */
    async handleClientReadyEvent(client: Client): Promise<void> {
        console.log(`Bot online - User ID: ${client.user!.id} - Username: ${client.user!.tag}`);
    }

    /**
     * Lida com eventos de erro
     * Registra erros para fins de depuração
     */
    async handleErrorEvent(error: Error): Promise<void> {
        console.error(`Discord error: ${error.stack}`);
    }

    /**
     * Lida com eventos de criação de mensagem
     * Salva as interações do usuário se a flag de funcionalidade estiver habilitada
     *
     * Filtra:
     * - Mensagens do sistema
     * - Mensagens vazias
     * - Mensagens apenas com menção
     * - Mensagens de bot
     */
    // eslint-disable-next-line complexity
    async handleMessageCreateEvent(message: Message): Promise<void> {
        // Verificar se a flag de funcionalidade está habilitada para este servidor
        if (
            !this.featureFlagsService.getFlag(message.guildId!, 'salvar_interacoes') ||
            ![
                ChannelType.GuildText,
                ChannelType.PublicThread,
                ChannelType.GuildStageVoice,
                ChannelType.GuildVoice,
            ].includes(message.channel.type)
        ) {
            return;
        }

        // Filtrar mensagens do sistema, mensagens vazias, apenas menções e mensagens sem servidor
        if (
            message.author.system ||
            !message.content?.trim() ||
            message.content.match(/^<@!?\d+>$/) ||
            !message.guild
        ) {
            return;
        }

        try {
            // Buscar detalhes do canal
            const channel = await this.client.channels.fetch(message.channelId);
            if (!channel || channel.isDMBased() || channel.isVoiceBased()) {
                return;
            }

            const channelParent = channel.parent;
            if (!channelParent) {
                return;
            }

            // Obter o cargo mais alto do usuário por hierarquia
            const member = await message.guild.members.fetch(message.author.id);
            const roles = member.roles.cache.filter((role: Role) => role.id !== message.guild!.id);
            const sortedRoles = roles.sort(
                (role1: Role, role2: Role) => role2.position - role1.position,
            );

            const firstRole = sortedRoles.first();
            if (!firstRole) {
                console.warn(
                    `No roles found for user in guild ${message.guildId}, interaction ignored`,
                );
                return;
            }

            // Construir o payload da interação para o N8n
            const localTime = new Date(message.createdTimestamp).toISOString();
            const body: InteractionPayload = {
                createdBy: message.author.globalName || 'Unknown User',
                guild: message.guild.name,
                message: message.content,
                timestamp: localTime,
                id: message.id,
                authorRole: firstRole.name,
                thread: null,
                channel: null,
                class: null,
            };

            // Preencher informações de canal/turma/thread com base no tipo de canal
            if (
                [
                    ChannelType.GuildText,
                    ChannelType.GuildVoice,
                    ChannelType.GuildStageVoice,
                ].includes(message.channel.type)
            ) {
                body.channel = channel.name;
                body.class = channelParent.name;
            } else {
                body.thread = channel.name;
                body.channel = (
                    this.client.channels.cache.get(channelParent.id) as ForumChannel
                ).name;
                body.class = (
                    this.client.channels.cache.get(
                        (this.client.channels.cache.get(channel.parent.id) as ForumChannel).parent!
                            .id,
                    ) as CategoryChannel
                ).name;
            }

            // Enviar dados de interação para o N8n
            await this.n8nService.saveInteraction(body).catch((error) => {
                console.error(`Failed to save interaction: ${error.message}`);
            });
        } catch (error) {
            console.error(
                `Error handling message event: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Lida com o evento de entrada de membro
     * Envia mensagem de boas-vindas se a flag de funcionalidade estiver habilitada
     */
    async handleGuildMemberAddEvent(member: GuildMember): Promise<void> {
        // Verificar se as mensagens de boas-vindas estão habilitadas
        if (!this.featureFlagsService.getFlag(member.guild.id!, 'enviar_mensagem_de_boas_vindas')) {
            return;
        }

        try {
            // Encontrar o canal de boas-vindas
            const welcomeChannel: TextChannel = member.guild.channels.cache.find(
                (channel: GuildBasedChannel): boolean => channel.name === WELCOME_CHANNEL_NAME,
            ) as TextChannel;

            if (!welcomeChannel) {
                console.warn(`Welcome channel not found in guild ${member.guild.name}`);
                return;
            }

            // Delegar para o serviço
            await this.discordService.messages.sendWelcomeMessage({
                targetChannel: welcomeChannel,
                profile: member,
            });
        } catch (error) {
            console.error(
                `Error sending welcome message: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Lida com o evento de criação de interação (comandos slash, menus de contexto)
     * Roteia comandos para os manipuladores de comandos
     */
    async handleInteractionCreateEvent(interaction: BaseInteraction): Promise<void> {
        // Apenas lidar com comandos slash e comandos de menu de contexto
        if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) {
            return;
        }

        try {
            // Construir o contexto para a execução do comando
            const context: ICommandContext = {
                featureFlagsService: this.featureFlagsService,
                client: this.client,
                commands: this.commands,
                schedulerService: this.schedulerService,
                discordService: this.discordService,
            };

            // Encontrar o comando correspondente
            const command = this.commands.find(
                (cmd) => cmd.build().name === interaction.commandName,
            );

            if (command) {
                await command.execute(interaction, context);
            } else {
                console.error(`Command not found: ${interaction.commandName}`);
            }
        } catch (error) {
            console.error(
                `Error handling interaction: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Lida com o evento de exclusão de servidor (guild)
     * Limpa as flags de funcionalidade quando o bot é removido do servidor
     */
    async handleGuildDeleteEvent(guild: Guild): Promise<void> {
        try {
            await this.flagsRepository.deleteGuildFeatureFlags(guild.id);
            console.log(`Feature flags deleted for guild: ${guild.id}`);
        } catch (error) {
            console.error(
                `Error cleaning up guild data: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    /**
     * Lida com eventos brutos do gateway (raw events)
     * Usado para capturar eventos de finalização de enquete
     * Salva enquetes finalizadas no banco de dados
     */
    // eslint-disable-next-line complexity
    async handleRawEvent(packet: IRawPacket): Promise<void> {
        // Apenas processar eventos de atualização de mensagem
        if (packet.t !== 'MESSAGE_UPDATE') {
            return;
        }

        const data = packet.d;

        // Validar a estrutura do pacote
        if (!data.channel_id || !data.id) {
            return;
        }

        // Verificar se o salvamento de enquete está habilitado
        if (!this.featureFlagsService.getFlag(data.guild_id!, 'salvar_enquetes')) {
            return;
        }

        // Verificar se a enquete está finalizada
        if (!data.poll || !data.poll.results || !data.poll.results.is_finalized) {
            return;
        }

        try {
            // Buscar detalhes da mensagem e do servidor
            const channel = (await this.client.channels.fetch(data.channel_id)) as TextChannel;
            if (!channel) {
                return;
            }

            const message = await channel.messages.fetch(data.id);
            if (!message.guild || !message.poll) {
                return;
            }

            // Calcular a duração da enquete
            const now = new Date();
            const expireTime = new Date(message.poll.expiresTimestamp!).getTime();
            const durationHours = ((now.getTime() - expireTime) / (1000 * 60 * 60)).toFixed(0);

            // Construir o payload da enquete para o N8n
            const className = channel.parent?.name;
            const guildName = message.guild.name;

            const payload: Poll = {
                created_by: message.author?.globalName ?? message.author!.username!,
                guild: guildName,
                poll_category: className!,
                poll_hash: generatePollHash(
                    message.createdAt.getFullYear().toString(),
                    message.createdAt.getMonth().toString(),
                    message.poll.question.text!,
                ),
                question: message.poll.question.text!,
                answers: message.poll.answers.map((answer: PollAnswer | PartialPollAnswer) => ({
                    response: answer.text!,
                    answers: answer.voteCount,
                })),
                duration: durationHours,
            };

            // Enviar dados da enquete para o N8n
            await this.n8nService.savePoll(payload).catch((error) => {
                console.error(
                    `Failed to save poll: ${error instanceof Error ? error.message : String(error)}`,
                );
            });
        } catch (error) {
            console.error(
                `Error processing poll event: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
}
