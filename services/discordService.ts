import type {
    IDiscordClassService,
    IDiscordCommandsService,
    IDiscordEventService,
    IDiscordMessageService,
    IDiscordRoleService,
    IDiscordService
} from "../types/discord.interfaces.ts";
import {Client} from "discord.js";
import EventsSubService from "./discord/eventsSubService.ts";
import MessagesSubService from "./discord/messagesSubService.ts";
import RolesSubService from "./discord/rolesSubService.ts";
import ClassSubService from "./discord/classSubService.ts";
import CommandsSubService from "./discord/commandsSubService.ts";
import LinkedinService from "./linkedinService.ts";
import FeatureFlagsService from "./featureFlagsService.ts";


export default class DiscordService implements IDiscordService {
    events: IDiscordEventService;
    messages: IDiscordMessageService;
    roles: IDiscordRoleService
    class: IDiscordClassService;
    commands: IDiscordCommandsService;

    constructor(private client: Client, private linkedinService: LinkedinService, private featureFlagsService: FeatureFlagsService) {
        this.events = new EventsSubService(this.client)
        this.messages = new MessagesSubService(this.client, this.linkedinService, this.featureFlagsService)
        this.roles = new RolesSubService()
        this.class = new ClassSubService(this.client)
        this.commands = new CommandsSubService()
    }
}