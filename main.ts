// Fontes externas
import {GlobalFonts} from "@napi-rs/canvas";
import fs from 'node:fs';
import path from 'node:path';

// Fontes internas
import DatabaseConnection from "./repositories/database/databaseConnection.ts";
import LoggerService from "./infrastructure/loggerService.ts";
import DatabaseFlagsRepository from "./repositories/database/databaseFlagsRepository.ts";
import FeatureFlagsService from "./services/featureFlagsService.ts";
import DiscordController from "./controller/DiscordController.ts";
import ShutdownService from "./infrastructure/shutdownService.ts";
import registerDiscordEvents from "./routes/discordRouter.ts";
import {discordClient} from './infrastructure/discordClient.ts'
import buildRoutes from "./routes/webhookRouter.ts";

// Types and Interfaces
import type {ICommand} from "./types/discord.interfaces.ts";
import {Guild} from "discord.js";
import DatabaseCheckRepository from "./repositories/database/databaseCheck.ts";
import Scheduler from "./infrastructure/scheduler.ts";
import {SchedulerService} from "./services/schedulerService.ts";
import DiscordService from "./services/discordService.ts";
import LinkedinService from "./services/linkedinService.ts";
import {env} from "./config/env.ts";
import N8nService from "./services/n8nService.ts";
import {WebhookController} from "./controller/webhookController.ts";
import DatabaseWarningRepository from "./repositories/database/databaseWarningRepository.ts";

async function bootstrap(): Promise<void> {
    LoggerService.init()
    GlobalFonts.registerFromPath("./assets/Coolvetica Hv Comp.otf", "normalFont")

    // Login do bot ao Discord
    console.time("Login do bot no Discord")
    const client = discordClient
    await client.login(env.DISCORD_BOT_TOKEN)
        .catch(() => {throw new Error("Falha ao conectar ao bot no Discord")})
        .then(() => console.log("Bot conectado ao Discord"))
    console.timeEnd("Login do bot no Discord")


    // Verificação dinâmica de comandos existentes
    console.time("Carregamento de comandos")
    const commands: ICommand[] = [];
    const commandsPath = path.join(__dirname, './controller/commands/');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const module = await import(filePath);

        type CommandConstructor = new () => ICommand;

        const CommandClass = Object.values(module).find(
            (exp): exp is CommandConstructor =>
                typeof exp === 'function' &&
                'prototype' in exp &&
                exp.prototype !== undefined &&
                'execute' in (exp).prototype
        );

        if (CommandClass) {
            const commandInstance = new CommandClass();
            commands.push(commandInstance);
        } else {
            console.warn(`Pulando ${file}: o arquivo não exporta uma classe válida com o método 'execute'`);
        }
    }
    console.timeEnd("Carregamento de comandos")

    const databaseConnection = new DatabaseConnection()
    const databaseCheckRepository = new DatabaseCheckRepository(databaseConnection)
    const databaseFlagsRepository = new DatabaseFlagsRepository(databaseConnection)
    const databaseWarningRepository = new DatabaseWarningRepository(databaseConnection)

    // Inicialização do banco de dados e checagem de tabelas
    await databaseConnection.connect()
        .catch((error: Error) => {throw new Error(`Falha ao conectar ao banco de dados\n${error}`)})
        .then(() => console.log("Conectado ao banco de dados"))

    await databaseCheckRepository.checkSchemas()

    await databaseFlagsRepository.checkEmptyFeatureFlags(client.guilds.cache.map((guild: Guild) => guild.id))
        .then(() => console.log("Feature Flags verificadas"))


    // Inicialização das featureFlags globais
    console.time("Carregamento de feature flags no cache")
    const featureFlagsService = new FeatureFlagsService(
        await databaseFlagsRepository.getAllFeatureFlags(), 
        databaseFlagsRepository
    )
    console.timeEnd("Carregamento de feature flags no cache")

    const n8nService = new N8nService()
    const schedulerService = new SchedulerService(client, featureFlagsService, n8nService, databaseWarningRepository)
    const linkedinService = new LinkedinService()
    const discordService = new DiscordService(client, linkedinService)
    const webhookController = new WebhookController({client, featureFlagsService, discordService})

    const discordController = new DiscordController(
        discordService, 
        schedulerService, 
        featureFlagsService, 
        databaseFlagsRepository, 
        n8nService, 
        commands, 
        client
    )
    registerDiscordEvents(client, discordController)

    console.time("Registro de comandos no Discord")
    await discordService.commands.registerCommand(
        client.guilds.cache.values().toArray(),
        commands
    ).then(() => {
        console.log("Comandos registrados com sucesso")
        console.timeEnd("Registro de comandos no Discord")
    })

    // Inicialização do webhook
    Bun.serve({
        port: env.PRIMARY_WEBHOOK_PORT,
        routes: buildRoutes(webhookController),
        fetch: () => new Response("Not Found", { status: 404 }),
    });
    console.log("Webhook iniciado")


    Scheduler.start(schedulerService)
    console.log("Scheduler iniciado")

    process.on('SIGINT', async () => await ShutdownService.shutdown(client, discordService.commands, databaseConnection));
    process.on('SIGTERM', async () => await ShutdownService.shutdown(client, discordService.commands, databaseConnection));
}

bootstrap().catch(error => console.error(`Erro fatal: ${error}`))