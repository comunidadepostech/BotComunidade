import {GlobalFonts} from '@napi-rs/canvas'

import {PingCommand} from "./commands/ping.js"
import {ExtractCommand} from "./commands/extract.js";
import {DisableCommand} from "./commands/disable.js";
import {UpdateFlagCommand} from "./commands/updateflag.js";
import {ViewFlagsCommand} from "./commands/viewflags.js";
import {InviteCommand} from "./commands/invite.js";
import {EchoCommand} from "./commands/echo.js";
import {DisplayCommand} from "./commands/display.js";
import {PollCommand} from "./commands/poll.js";
import {CreateClassCommand} from "./commands/createclass.js";
import {EventCommand} from "./commands/event.js";

import {ClientReady} from "./clientEvents/once/ClientReady.js"
import {GuildMemberAdd} from "./clientEvents/on/GuildMemberAdd.js";
import {GuildCreate} from "./clientEvents/on/GuildCreate.js";
import {InteractionCreate} from "./clientEvents/on/interactionCreate.js";
import {EventsWebhook} from "./functions/webhooks/createEvent.js";
import {Debug} from "./clientEvents/on/debug.js";
import {Err} from "./clientEvents/on/error.js";
import {Warning} from "./clientEvents/on/warning.js";
import {GatewayIntentBits} from "discord.js";

import {Bot} from "./bot.js";
import {RawEvent} from "./clientEvents/on/raw.js";


// Carrega as variáveis de ambiente
await process.loadEnvFile()


async function main() {
    const bot = new Bot();

    // Inicialização e Configuração
    bot._initializeClient([
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessagePolls,
        GatewayIntentBits.GuildMessageReactions
    ]);
    bot._initializeDefaultFlags({
        //comandos
        invite: true,
        echo: true,
        display: true,
        poll: true,
        createclass: false,
        extract: true,
        event: true,
        disable: false,

        //eventos
        checkEvents: false,
        getMembers: false,
        saveInteractions: false,
        savePolls: false,
        sendWelcomeMessage: false
    });

    GlobalFonts.registerFromPath("./assets/Coolvetica Hv Comp.otf", "normalFont");

    // Conexão com Banco de Dados
    await bot._initializeDatabase();
    await bot.db.connect();
    await bot.db.verifyTables();
    bot.flags = await bot.db.getFlags();

    // Inicialização de Comandos
    const commandsArray = [
        new PingCommand(),
        new InviteCommand(bot.db),
        new EchoCommand(bot.client),
        new DisplayCommand(bot.db),
        new PollCommand(),
        new CreateClassCommand(bot.db),
        new ExtractCommand(bot.db),
        new EventCommand(),
        new DisableCommand(),
        new UpdateFlagCommand(bot.db, bot.flags),
        new ViewFlagsCommand(bot.flags)
    ];
    bot.commands = new Map(commandsArray.map(cmd => [cmd.name, cmd]));

    // Inicialização de Eventos do Cliente
    const clientReady = new ClientReady(bot.db, bot.commands, bot.defaultFlags, bot.flags);

    // Armazenar a instância do ClientReady no client para que outros possam acessá-la
    bot.client._clientReadyInstance = clientReady;

    bot.events = [
        new GuildCreate(bot.db),
        new GuildMemberAdd(bot.db),
        clientReady,
        new InteractionCreate(bot.commands, bot.flags),
        new Debug(),
        new Err(),
        new Warning(),
        new RawEvent(bot.flags)
    ];
    await bot.registerEvents();

    // Inicialização do Webhook
    bot.webhook = new EventsWebhook();
    await bot.webhook.createWebhook();
    await bot.webhook.displayWebhook(bot.client);

    // Login
    await bot.login(process.env.TOKEN);

    // Verificação de flags
    await bot.db.checkFlags(bot.flags, bot.defaultFlags, bot.client) ? bot.flags = await bot.db.getFlags() : null

    // Configuração do Desligamento Seguro (Graceful Shutdown)
    const shutdown = async (signal) => {
        console.log(`LOG - Recebido ${signal} - desligando graciosamente...`);
        bot.client.removeAllListeners();
        await bot.db.endConnection();
        await bot.client.destroy();
        console.log('LOG - Desligamento completo');
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(error => {
    console.error("ERRO - Falha fatal na inicialização do bot:", error);
    process.exit(1);
});
