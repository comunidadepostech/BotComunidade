import {GlobalFonts} from '@napi-rs/canvas'
import {Bot} from "./bot.js";
import fs from "node:fs"
import path from "node:path";


// Carrega as variáveis de ambiente
// console.log(__dirname, process.cwd())
fs.existsSync(path.resolve(import.meta.dirname, '.env')) ? process.loadEnvFile("./.env") : process.loadEnvFile("./.dockerenv")
GlobalFonts.registerFromPath("./assets/Coolvetica Hv Comp.otf", "normalFont");

async function main() {
    const bot = new Bot();

    // Conexão com Banco de Dados
    await bot.db.connect()
        .then(() => console.log('LOG - Conexão com o banco de dados estabelecida'))
        .catch(error => {console.error('ERRO - Falha ao conectar ao banco de dados:', error.message); process.exit(0)})
    await bot.db.verifyTables()
        .then(() => console.log("LOG - Tabelas verificadas"));

    bot.flags = await bot.db.getFlags();

    // Login
    await bot.login(process.env.TOKEN)
        .then(() => console.log('LOG - Bot conectado ao Discord'))
        .catch(error => console.error('ERRO - Falha ao conectar ao Discord:', error.message));

    bot.webhook.start(bot);

    // Verificação de flags
    let checkState = true
    while (checkState) {
        checkState = await bot.db.checkFlags(bot.flags, bot.defaultFlags, bot.client)
        bot.flags = await bot.db.getFlags()
    }
    console.log("LOG - Todas as flags foram verificadas")

    await bot.scheduler.start()
    console.log("LOG - Scheduler iniciado")

    await bot.build().then(() => console.log('LOG - Bot totalmente carregado'))

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
try {
    await main()
} catch (error) {
    console.error("ERRO - Falha fatal na inicialização do bot:", error);
    process.exit(1);
}
