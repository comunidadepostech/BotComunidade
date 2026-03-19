import {
    Client,
    ContextMenuCommandBuilder, Guild,
    GuildMember,
    Role,
    SlashCommandOptionsOnlyBuilder,
    TextChannel
} from "discord.js";
import {SchedulerService} from "../services/schedulerService.ts";
import FeatureFlagsService from "../services/featureFlagsService.ts";
import {CommandEventDto, ExternalSourceEventDto} from "../dtos/event.dtos.ts";
import {BroadcastMessageDto} from "../dtos/broadcastMessage.dto.ts";
import sendWarningDTO from "../dtos/sendWarning.dto.ts";
import sendWelcomeMEssageDTO from "../dtos/sendWelcomeMessage.dto.ts";
import classCreationDTO from "../dtos/classCreation.dto.ts";
import {PollMessageDto} from "../dtos/pollMessage.dto.ts";

export interface Command {
    build(): SlashCommandOptionsOnlyBuilder | ContextMenuCommandBuilder,
    execute(interaction: any, context: CommandContext): Promise<void | Error>
}

export interface CommandContext {
    featureFlagsService: FeatureFlagsService;
    client: Client,
    commands: Command[],
    schedulerService: SchedulerService,
    discordService: IDiscordService
}

export interface ChannelConfig {
    name: string;
    type: number;
    position: number;
    restrictStudents?: boolean;
}

export interface IDiscordService {
    readonly events: IDiscordEventService;
    readonly messages: IDiscordMessageService;
    readonly roles: IDiscordRoleService;
    readonly class: IDiscordClassService;
    readonly commands: IDiscordCommandsService;
}

export interface IDiscordCommandsService {
    clearCommands(guilds: Guild[]): Promise<void>
    registerCommand(guilds: Guild[], commands: Command[]): Promise<void>
}

export interface IDiscordClassService {
    create(dto: classCreationDTO): Promise<{role: Role, message: string} | Error>
    disable(role: Role): Promise<void | Error>
}

export interface IDiscordRoleService {
    delete(role: Role): Promise<void | Error>
    removeFromUser(user: GuildMember, roleId: string): Promise<void | Error>
}

export interface IDiscordEventService {
    create(dto: CommandEventDto | ExternalSourceEventDto): Promise<void | Error>;
    delete(guildId: string, eventId: string): Promise<void | Error>;
}

export interface IDiscordMessageService {
    broadcast(dto: BroadcastMessageDto): Promise<void>;
    sendWarning(dto: sendWarningDTO): Promise<void>
    sendLivestreamPoll(targetChannel: TextChannel, role: Role): Promise<void>
    sendWelcomeMessage(dto: sendWelcomeMEssageDTO): Promise<void | Error>;
    createPoll(dto: PollMessageDto): Promise<void | Error>
}