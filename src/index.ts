import { GlobalFonts } from '@napi-rs/canvas';
import { WinstonLogger } from './services/logger.service.ts';
import env from './config/env.ts';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import CreateclassCommand from './controllers/discord/commands/createClass.command.ts';
import EchoCommand from './controllers/discord/commands/echo.command.ts';
import EditCommand from './controllers/discord/commands/edit.command.ts';
import EndPollCommand from './controllers/discord/commands/endPoll.command.ts';
import EventCommand from './controllers/discord/commands/event.command.ts';
import ExecCommand from './controllers/discord/commands/exec.command.ts';
import GetPollHashMenuCommand from './controllers/discord/commands/getPollHash.command.ts';
import HelpCommand from './controllers/discord/commands/help.command.ts';
import PingCommand from './controllers/discord/commands/ping.command.ts';
import PollCommand from './controllers/discord/commands/poll.command.ts';
import ViewFlagsCommand from './controllers/discord/commands/flags.command.ts';
import EventMessageDeleteController from './controllers/scheduler/eventMessageDelete.controller.ts';
import EventVerificationController from './controllers/scheduler/eventVerification.controller.ts';
import OnlineMembersCountController from './controllers/scheduler/onlineMembersCount.controller.ts';
import TotalMembersCountController from './controllers/scheduler/totalMembersCount.controller.ts';
import DuplicatedStudentRolesController from './controllers/scheduler/duplicatedStudentRoles.controller.ts';
import DatabaseConnection from './infrastructure/database/prisma/database.client.ts';
import DiscordAdapter from './infrastructure/adapters/discord.adapter.ts';
import WebhookLiveFormsController from './controllers/webhook/liveForms.controller.ts';
import GuildMemberAddEventController from './controllers/discord/events/guildMemberAdd.controller.ts';
import GuildCreateEventController from './controllers/discord/events/guildCreate.controller.ts';
import GuildDeleteEventController from './controllers/discord/events/guildDelete.controller.ts';
import InteractionCreateEventController from './controllers/discord/events/interactionCreate.controller.ts';
import MessageCreateEventController from './controllers/discord/events/messageCreate.controller.ts';
import WebhookMessageController from './controllers/webhook/message.controller.ts';
import WebhookEventController from './controllers/webhook/event.controller.ts';
import WebhookVacancyController from './controllers/webhook/vacancy.controller.ts';
import { AppError } from './types/errors.types.ts';
import MessageService from './services/message.service.ts';
import GuildsRepository from './infrastructure/database/prisma/repositories/guilds.repository.ts';
import FeatureFlagsRepository from './infrastructure/database/prisma/repositories/featureFlags.repository.ts';
import CommandHashRepository from './infrastructure/database/prisma/repositories/commandHash.repository.ts';
import MessageRepository from './infrastructure/database/prisma/repositories/message.repository.ts';
import WarningRepository from './infrastructure/database/prisma/repositories/warning.repository.ts';
import FeatureFlagsService from './services/featureFlags.service.ts';
import ClassService from './services/class.service.ts';
import GuildService from './services/guild.service.ts';
import EventService from './services/event.service.ts';
import InviteCommand from './controllers/discord/commands/invite.command.ts';
import NapiCanvasAdapter from './infrastructure/adapters/napiCanvas.adapter.ts';
import N8nAdapter from './infrastructure/adapters/n8n.adapter.ts';
import HashingService from './services/hashing.service.ts';
import MessageUpdateEventController from './controllers/discord/events/messageUpdate.controller.ts';
import RawEventController from './controllers/discord/events/raw.controller.ts';
import MemberService from './services/member.service.ts';
import MembersRepository from './infrastructure/database/prisma/repositories/onlineMembers.repository.ts';
import ChannelService from './services/channel.service.ts';
import RoleService from './services/role.service.ts';
import ReplyCommand from './controllers/discord/commands/reply.command.ts';

// Create logger
const logger = new WinstonLogger();

// Load external resourses
GlobalFonts.registerFromPath('./assets/Coolvetica Hv Comp.otf', 'normalFont');

async function bootstrap(): Promise<void> {
    // Create Discord client and connect to it
    const discordClient = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildScheduledEvents,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildMessagePolls,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildPresences,
        ],
    });
    await discordClient.login(env.DISCORD_BOT_TOKEN).then(() => logger.info('Connected to Discord'));

    // Create Prisma client
    const prismaClient = await new DatabaseConnection(logger).connect();

    // Create Repositories
    const featureFlagsRepository = new FeatureFlagsRepository(prismaClient);
    const guildsRepository = new GuildsRepository(prismaClient);
    const commandHashRepository = new CommandHashRepository(prismaClient);
    const messageRepository = new MessageRepository(prismaClient);
    const warningRepository = new WarningRepository(prismaClient);
    const memberRepository = new MembersRepository(prismaClient);

    // Create Adapters
    const discordAdapter = new DiscordAdapter(discordClient);
    const napiCanvasAdapter = new NapiCanvasAdapter();
    const n8nAdapter = new N8nAdapter(logger);

    // Create Services
    const featureFlagsService = new FeatureFlagsService(featureFlagsRepository, guildsRepository);
    const messageService = new MessageService(
        discordAdapter,
        guildsRepository,
        discordAdapter,
        discordAdapter,
        logger,
        messageRepository,
        napiCanvasAdapter,
        n8nAdapter,
        warningRepository,
        discordAdapter,
        discordAdapter
    );
    const classService = new ClassService(discordAdapter, discordAdapter, discordAdapter, discordAdapter);
    const guildService = new GuildService(guildsRepository, featureFlagsRepository);
    const eventService = new EventService(discordAdapter, featureFlagsService);
    const hashingService = new HashingService();
    const memberService = new MemberService(memberRepository);
    const channelService = new ChannelService(discordAdapter);
    const roleService = new RoleService(discordAdapter, discordAdapter);

    // Sync the cache and check the flags
    await guildService.syncGuilds();
    await featureFlagsService.fillFlags();
    await featureFlagsService.checkFlags();
    await featureFlagsService.syncFlags();
    await warningRepository.syncWarningMessages();

    // Create controllers
    // Scheduler
    const eventMessageDeleteController = new EventMessageDeleteController(messageService);
    const eventVerificationController = new EventVerificationController(
        eventService,
        featureFlagsService,
        messageService,
    );
    const onlineMembersCountController = new OnlineMembersCountController(memberService, discordClient);
    const totalMembersCountController = new TotalMembersCountController(
        logger,
        memberService,
        discordClient,
        featureFlagsService,
    );

    const duplicatedStudentRolesController = new DuplicatedStudentRolesController(
        logger,
        roleService,
        discordClient,
        featureFlagsService,
    );

    // Slash commands
    const createClassCommand = new CreateclassCommand(featureFlagsService, classService);
    const echoCommand = new EchoCommand(messageService, logger);
    const editCommand = new EditCommand(logger);
    const endPollCommand = new EndPollCommand(logger);
    const eventCommand = new EventCommand(eventService);
    const execCommand = new ExecCommand(
        featureFlagsService,
        onlineMembersCountController,
        totalMembersCountController,
        eventVerificationController,
        eventMessageDeleteController,
        duplicatedStudentRolesController,
    );
    const getPollHashCommand = new GetPollHashMenuCommand(hashingService);
    const helpCommand = new HelpCommand();
    const pingCommand = new PingCommand();
    const pollCommand = new PollCommand(messageService, logger);
    const viewFlagsCommand = new ViewFlagsCommand(featureFlagsService, logger);
    const inviteCommand = new InviteCommand();
    const replyCommand = new ReplyCommand(messageService, logger);

    const commands = [
        createClassCommand,
        echoCommand,
        editCommand,
        endPollCommand,
        eventCommand,
        execCommand,
        getPollHashCommand,
        helpCommand,
        pingCommand,
        pollCommand,
        viewFlagsCommand,
        inviteCommand,
        replyCommand
    ];

    // Webhook
    const webhookEventController = new WebhookEventController(logger, eventService, guildService, channelService);
    const webhookWarningController = new WebhookMessageController(logger, guildService, channelService, messageService, roleService);
    const webhookLiveFormsController = new WebhookLiveFormsController(
        logger,
        guildService,
        channelService,
        messageService,
        roleService,
        featureFlagsService
    );
    const webhookVacancyController = new WebhookVacancyController(logger, messageService, channelService, guildService);

    // Discord
    const discordGuildCreateEventController = new GuildCreateEventController(guildService, logger);
    const discordGuildDeleteEventController = new GuildDeleteEventController(logger);
    const discordMessageCreateEventController = new MessageCreateEventController(
        logger,
        featureFlagsService,
        messageService,
    );
    const discordGuildMemberAddEventController = new GuildMemberAddEventController(
        logger,
        messageService,
        featureFlagsService,
    );
    const discordInteractionCreateEventController = new InteractionCreateEventController(commands, logger);
    const discordMessageUpdateEventController = new MessageUpdateEventController(
        logger,
        featureFlagsService,
        messageService,
        hashingService,
    );
    const discordRawEventController = new RawEventController(logger);

    // Register event handlers
    discordClient.on(Events.ClientReady, (_client) =>
        logger.info(`Bot online - User ID: ${discordClient.user!.id} - Username: ${discordClient.user!.tag}`),
    );
    discordClient.on(Events.GuildCreate, (guild) =>
        discordGuildCreateEventController
            .handle(guild)
            .catch((error) => logger.error(error.message, { stacktrace: error.stack })),
    );
    discordClient.on(Events.Error, (error) => logger.error(`Discord error: ${error}\n${error.stack}`));
    discordClient.on(Events.GuildMemberAdd, (member) =>
        discordGuildMemberAddEventController
            .handle(member)
            .catch((error) => logger.error(error.message, { stacktrace: error.stack })),
    );
    discordClient.on(
        Events.InteractionCreate,
        (interaction) => discordInteractionCreateEventController.handle(interaction), // Error handling inside controller
    );
    discordClient.on(Events.MessageCreate, (message) =>
        discordMessageCreateEventController
            .handle(message)
            .catch((error) => logger.error(error.message, { stacktrace: error.stack })),
    );
    discordClient.on(Events.GuildDelete, (guild) =>
        discordGuildDeleteEventController
            .handle(guild)
            .catch((error) => logger.error(error.message, { stacktrace: error.stack })),
    );
    discordClient.on(Events.MessageUpdate, (message) =>
        discordMessageUpdateEventController
            .handle(message)
            .catch((error) => logger.error(error.message, { stacktrace: error.stack })),
    );
    discordClient.on(Events.Raw, (packet) =>
        discordRawEventController
            .handle(packet)
            .catch((error) => logger.error(error.message, { stacktrace: error.stack })),
    );

    // Clear and Register slash commands
    {
        const currentCommandNames = new Set(commands.map((cmd) => cmd.build().name));

        const allStoredCommands = await commandHashRepository.getAllCommands();

        const commandsToDelete = allStoredCommands.filter((stored) => !currentCommandNames.has(stored.command_name));

        for (const orphanedCommand of commandsToDelete) {
            const name = orphanedCommand.command_name;

            await discordAdapter.deleteCommand(name);
            await commandHashRepository.deleteCommand(name);
        }

        for (const command of commands) {
            const commandHash = Bun.SHA256.hash(JSON.stringify(command.build().toJSON()), 'hex');

            const storedCommand = await commandHashRepository.getCommandByName(command.build().name);

            if (!storedCommand) {
                await commandHashRepository.saveCommand(command.build().name, commandHash);
                await discordAdapter.registerCommand(command);
                continue;
            }

            if (commandHash !== storedCommand.file_hash) {
                await commandHashRepository.updateCommand(command.build().name, commandHash);
                await discordAdapter.updateCommand(command);
            }
        }
    }

    // Start scheduler
    Bun.cron(`*/${env.DISCORD_EVENTS_CHECK_TIME_IN_MINUTES} * * * *`, async () => {
        logger.info('Event Verification executed by scheduler');
        await eventVerificationController
            .handle()
            .catch((error) => logger.error(error.message, { stacktrace: error.stack }));
    });
    Bun.cron(`0 0 ${env.DAY_OF_THE_MONTH_FOR_MEMBERS_COUNT} * *`, async () => {
        logger.info('Monthly members count executed by scheduler');
        await totalMembersCountController
            .handle()
            .catch((error) => logger.error(error.message, { stacktrace: error.stack }));
    });
    Bun.cron(`0 0 */${env.CLEAR_WARNING_MESSAGES_EVENT_DELAY_IN_HOURS} * *`, async () => {
        logger.info('Event messages clear executed by scheduler');
        await eventMessageDeleteController
            .handle()
            .catch((error) => logger.error(error.message, { stacktrace: error.stack }));
    });
    Bun.cron(`*/${env.ONLINE_MEMBERS_COUNT_DELAY_IN_MINUTES} * * * *`, async () => {
        logger.info('Online members count executed by scheduler');
        await onlineMembersCountController
            .handle()
            .catch((error) => logger.error(error.message, { stacktrace: error.stack }));
    });
    Bun.cron('0 0 * * 0', async () => {
        logger.info('Duplicated student roles removal executed by scheduler');
        await duplicatedStudentRolesController
            .handle()
            .catch((error) => logger.error(error.message, { stacktrace: error.stack }));
    });

    // Start webhook server
    const webhook = Bun.serve({
        port: env.PRIMARY_WEBHOOK_PORT,
        routes: {
            '/api/v3/event': (req) =>
                webhookEventController.handle(req).catch((error) => {
                    logger.error(error.message, { stacktrace: error.stack });
                    return new Response(JSON.stringify({ status: 'error', error: 'Internal server error' }), {
                        status: 500,
                    });
                }),
            '/api/v3/message': (req) =>
                webhookWarningController.handle(req).catch((error) => {
                    logger.error(error.message, { stacktrace: error.stack });
                    return new Response(JSON.stringify({ status: 'error', error: 'Internal server error' }), {
                        status: 500,
                    });
                }),
            '/api/v3/message/liveForms': (req) =>
                webhookLiveFormsController.handle(req).catch((error) => {
                    logger.error(error.message, { stacktrace: error.stack });
                    return new Response(JSON.stringify({ status: 'error', error: 'Internal server error' }), {
                        status: 500,
                    });
                }),
            '/api/v3/message/vacancy': (req) =>
                webhookVacancyController.handle(req).catch((error) => {
                    logger.error(error.message, { stacktrace: error.stack });
                    return new Response(JSON.stringify({ status: 'error', error: 'Internal server error' }), {
                        status: 500,
                    });
                }),
            '/': () => new Response(JSON.stringify({ status: 'error', error: 'Not Found' }), { status: 404 }),
        },
    });
    logger.info('Webhook server started');

    // Graceful Shutdown (create a funtion to remove the duplicated code? nah, it's just 6 lines :p)
    process.on('SIGINT', async () => {
        discordClient.removeAllListeners();
        await discordClient.destroy();
        await prismaClient.$disconnect();
        await webhook.stop();
        logger.info('Process terminated gracefully!');
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        discordClient.removeAllListeners();
        await discordClient.destroy();
        await prismaClient.$disconnect();
        await webhook.stop();
        logger.info('Process terminated gracefully!');
        process.exit(0);
    });
}

// Start the application
bootstrap().catch((error) => {
    if (error instanceof AppError) {
        logger.error(`Fatal error: ${error.message} ${error.stack}`);
    } else {
        logger.error(`Fatal unknown error: ${error}`);
        process.exit(1);
    }
});
