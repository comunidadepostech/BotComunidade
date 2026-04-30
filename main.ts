// Dependências externas
import { GlobalFonts } from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';

// Dependências internas - Infraestrutura
import LoggerService from './infrastructure/loggerService.ts';
import { discordClient } from './infrastructure/discordClient.ts';
import Scheduler from './infrastructure/scheduler.ts';
import ShutdownService from './infrastructure/shutdownService.ts';
import { DIContainer } from './infrastructure/diContainer.ts';

// Controladores
import DiscordController from './controller/DiscordController.ts';
import { WebhookController } from './controller/webhookController.ts';

// Rotas
import registerDiscordEvents from './routes/discordRouter.ts';
import buildRoutes from './routes/webhookRouter.ts';

// Tipos e Interfaces
import type { ICommand } from './types/discord.interfaces.ts';
import { env } from './config/env.ts';

/**
 * Inicialização da Aplicação
 *
 * Sequência de inicialização:
 * 1. Configurar logging
 * 2. Carregar recursos externos
 * 3. Conectar ao Discord
 * 4. Inicializar banco de dados e repositórios
 * 5. Carregar comandos dinamicamente
 * 6. Configurar container de Injeção de Dependência
 * 7. Registrar manipuladores de eventos do Discord
 * 8. Iniciar servidor de webhooks
 * 9. Iniciar agendador (scheduler)
 * 10. Configurar encerramento gracioso (graceful shutdown)
 *
 * SOLID: Inversão de Dependência - utiliza DIContainer para gerenciar todas as dependências
 */
async function bootstrap(): Promise<void> {
    LoggerService.init();

    // Carregar fontes personalizadas para renderização em canvas
    GlobalFonts.registerFromPath('./assets/Coolvetica Hv Comp.otf', 'normalFont');

    // Conectar o bot ao Discord
    console.time('Discord login');
    const client = discordClient;
    await client
        .login(env.DISCORD_BOT_TOKEN)
        .catch(() => {
            throw new Error('Failed to login to Discord');
        })
        .then(() => console.log('Connected to Discord'));
    console.timeEnd('Discord login');

    // Carregar comandos slash dinamicamente
    console.time('Loading commands');
    const commands: ICommand[] = [];
    const commandsPath = path.join(process.cwd(), './controller/commands/');
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            const module = await import(filePath);

            type CommandConstructor = new () => ICommand;

            const CommandClass = Object.values(module).find(
                (exp): exp is CommandConstructor =>
                    typeof exp === 'function' &&
                    'prototype' in exp &&
                    exp.prototype !== undefined &&
                    'execute' in exp.prototype,
            );

            if (CommandClass) {
                const commandInstance = new CommandClass();
                commands.push(commandInstance);
            } else {
                console.warn(`Skipping ${file}: does not export a valid command class`);
            }
        } catch (error) {
            console.error(
                `Error loading command ${file}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
    console.timeEnd('Loading commands');

    // Inicializar o Container de Injeção de Dependência
    console.time('Initializing services');
    const container = new DIContainer(client);
    await container.initialize();
    const {
        featureFlagsService,
        discordService,
        schedulerService,
        flagsRepository,
        guildsRepository,
        n8nService,
    } = container.getServices();
    console.timeEnd('Initializing services');

    // Criar controladores
    const discordController = new DiscordController(
        discordService,
        schedulerService,
        featureFlagsService,
        flagsRepository,
        n8nService,
        commands,
        client,
    );

    const webhookController = new WebhookController({
        client,
        featureFlagsService,
        discordService,
        guildsRepository,
    });

    // Registrar manipuladores de eventos do Discord
    registerDiscordEvents(client, discordController);

    // Registrar comandos slash no Discord
    console.time('Registering commands');
    await discordService.commands
        .registerCommand(Array.from(client.guilds.cache.values()), commands)
        .then(() => {
            console.log('Commands registered successfully');
            console.timeEnd('Registering commands');
        });

    // Iniciar servidor de webhooks para integrações externas
    console.time('Starting webhook server');
    Bun.serve({
        port: env.PRIMARY_WEBHOOK_PORT,
        routes: buildRoutes(webhookController),
        fetch: () => new Response('Not Found', { status: 404 }),
    });
    console.log('Webhook server started');
    console.timeEnd('Starting webhook server');

    // Iniciar agendador de tarefas (scheduler)
    Scheduler.start(schedulerService);
    console.log('Scheduler started');

    // Configurar manipuladores de encerramento gracioso (graceful shutdown)
    process.on('SIGINT', async () => {
        await ShutdownService.shutdown(
            client,
            discordService.commands,
            container.getDatabaseConnection(),
        );
    });

    process.on('SIGTERM', async () => {
        await ShutdownService.shutdown(
            client,
            discordService.commands,
            container.getDatabaseConnection(),
        );
    });
}

// Iniciar aplicação
bootstrap().catch((error) => {
    if (error instanceof Error) {
        console.error(`Fatal error: ${error.message}\n${error.stack}`);
    } else {
        console.error(`Fatal error: ${error}`);
    }
    process.exit(1);
});
