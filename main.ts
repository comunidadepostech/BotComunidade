// Fontes externas
import {GlobalFonts} from "@napi-rs/canvas";
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';

// Fontes internas
import DatabaseConnection from "./repositories/database/databaseConnection.ts";
import LoggerService from "./infrastructure/loggerService.ts";
import DatabaseFlagsRepository from "./repositories/database/databaseFlagsRepository.ts";
import FeatureFlagsService from "./services/FeatureFlagsService.ts";
import DiscordController from "./controller/discord/discordController.ts";
import ShutdownService from "./infrastructure/shutdownService.ts";
import commandManagementService from "./services/commandManagementService.ts";
import registerDiscordEvents from "./gateway/discordRouter.ts";
import {discordClient} from './infrastructure/discordClient.ts'
import router from './gateway/webhookRouter.ts';

// Entidades
import {Command} from "./entities/discordEntities.ts";
import {Guild} from "discord.js";
import DatabaseCheckRepository from "./repositories/database/databaseCheck.ts";
import MessagingService from "./services/messagingService.ts";

LoggerService.init()
GlobalFonts.registerFromPath("./assets/Coolvetica Hv Comp.otf", "normalFont")

console.time("Login do bot no Discord")
// Login do bot ao Discord
const client =  discordClient
await client.login(process.env.DISCORD_BOT_TOKEN)
    .catch(() => {throw new Error("Falha ao conectar ao bot no Discord")})
    .then(() => console.log("Bot conectado ao Discord"))
console.timeEnd("Login do bot no Discord")


// Verificação dinâmica de comandos existentes
console.time("Carregamento de comandos")
const commands: Command[] = [];
const commandsPath = path.join(__dirname, './controller/discord/commands/');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const module = await import(filePath);

    // Procura o primeiro export que tenha 'execute'
    const command = Object.values(module).find(
        (exp): exp is Command => typeof exp === 'object' && exp !== null && 'execute' in exp
    );

    if (command) {
        commands.push(command);
    } else {
        console.warn(`Pulando ${file}: o arquivo não tem um método 'execute' ou não há named export`);
    }
}
console.timeEnd("Carregamento de comandos")



// Inicialização do banco de dados e checagem de tabelas
await DatabaseConnection.connect()
    .catch((error: Error) => {throw new Error(`Falha ao conectar ao banco de dados\n${error}`)})
    .then(() => console.log("Conectado ao banco de dados"))

await DatabaseCheckRepository.checkSchemas()

await DatabaseFlagsRepository.checkEmptyFeatureFlags(client.guilds.cache.map((guild: Guild) => guild.id))
   .then(() => console.log("Feature Flags verificadas"))


// Inicialização das featureFlags globais
console.time("Carregamento de feature flags no cache")
const flagService = new FeatureFlagsService(await DatabaseFlagsRepository.getAllFeatureFlags())
console.timeEnd("Carregamento de feature flags no cache")

const messagindService = new MessagingService()
const discordController = new DiscordController(flagService, messagindService, commands, client)
registerDiscordEvents(client, discordController)

console.time("Registro de comandos no Discord")
await commandManagementService.registerCommands(
    client.guilds.cache.values().toArray(),
    commands
).then(() => {
    console.log("Comandos registrados com sucesso")
    console.timeEnd("Registro de comandos no Discord")
})


// Inicialização do webhook
const app = express();
app.use(express.json());
app.use("/api", router);
app.listen(process.env.PRIMARY_WEBHOOK_PORT, () => console.log("Webhook iniciado"));


process.on('SIGINT', async () => await ShutdownService.shutdown(client));
process.on('SIGTERM', async () => await ShutdownService.shutdown(client));