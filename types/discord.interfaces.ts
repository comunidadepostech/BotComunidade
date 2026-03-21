import {
    Client,
    ContextMenuCommandBuilder, Guild,
    GuildMember,
    Role,
    TextChannel
} from "discord.js";

import type {SlashCommandOptionsOnlyBuilder} from "discord.js";
import {SchedulerService} from "../services/schedulerService.ts";
import FeatureFlagsService from "../services/featureFlagsService.ts";
import type {CommandEventDto, ExternalSourceEventDto} from "../dtos/event.dtos.ts";
import type {BroadcastMessageDto} from "../dtos/broadcastMessage.dto.ts";
import type SendWarningDto from "../dtos/sendWarningDto.ts";
import type SendWelcomeMessageDTO from "../dtos/sendWelcomeMessageDTO.ts";
import type ClassCreationDTO from "../dtos/classCreationDTO.ts";
import type {PollMessageDto} from "../dtos/pollMessage.dto.ts";

export interface RoleCount { roleName: string; count: number; }

export interface EventState {
    notified: boolean;
    maxParticipants: number;
    reported: boolean;
}

export interface ICommand {
    build(): SlashCommandOptionsOnlyBuilder | ContextMenuCommandBuilder,
    execute(interaction: any, context: ICommandContext): Promise<void>
}

export interface ICommandContext {
    featureFlagsService: FeatureFlagsService;
    client: Client,
    commands: ICommand[],
    schedulerService: SchedulerService,
    discordService: IDiscordService
}

export interface IChannelConfig {
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
    registerCommand(guilds: Guild[], commands: ICommand[]): Promise<void>
}

export interface IDiscordClassService {
    create(dto: ClassCreationDTO): Promise<{role: Role, message: string}>
    disable(role: Role): Promise<void>
}

export interface IDiscordRoleService {
    delete(role: Role): Promise<void | Error>
    removeFromUser(user: GuildMember, roleId: string): Promise<void>
}

export interface IDiscordEventService {
    create(dto: CommandEventDto | ExternalSourceEventDto): Promise<void>;
    delete(guildId: string, eventId: string): Promise<void>;
}

export interface IDiscordMessageService {
    broadcast(dto: BroadcastMessageDto): Promise<void>;
    sendWarning(dto: SendWarningDto): Promise<void>
    sendLivestreamPoll(targetChannel: TextChannel, role: Role): Promise<void>
    sendWelcomeMessage(dto: SendWelcomeMessageDTO): Promise<void>;
    createPoll(dto: PollMessageDto): Promise<void>
}

export interface IRawPacket {
    t: string;
    d: {
        guild_id?: string;
        channel_id?: string;
        id?: string;
        poll?: {
            results?: { is_finalized?: boolean };
        };
    };
}