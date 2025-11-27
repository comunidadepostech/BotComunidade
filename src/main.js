import {GlobalFonts} from '@napi-rs/canvas'
import {Bot} from "./bot.js";
import logger from "./utils/logger.js";
import fs from "node:fs"


// Carrega as variáveis de ambiente
if (fs.existsSync("./.env")) process.loadEnvFile("./.env")
GlobalFonts.registerFromPath("./assets/Coolvetica Hv Comp.otf", "normalFont");

async function main() {
    const bot = new Bot();

    // Conexão com Banco de Dados
    await bot.db.connect(process.env.MYSQL_URL)
        .then(() => logger.log('Conexão com o banco de dados estabelecida'))
        .catch(error => {logger.error('Falha ao conectar ao banco de dados:', error.message); process.exit(0)})
    await bot.db.verifyTables()
        .then(() => logger.log("Tabelas verificadas"));

    bot.flags = await bot.db.getFlags();

    // Login
    await bot.login(process.env.TOKEN)
        .then(() => logger.log('Bot conectado ao Discord'))
        .catch(error => logger.error('ERRO - Falha ao conectar ao Discord:', error.message));

    bot.webhook.start(bot);

    // Verificação de flags
    let checkState = true
    while (checkState) {
        checkState = await bot.db.checkFlags(bot.flags, bot.defaultFlags, bot.client)
        bot.flags = await bot.db.getFlags()
    }
    logger.log("Todas as flags foram verificadas")

    await bot.scheduler.start()
    logger.log("Scheduler iniciado")

    await bot.build().then(() => logger.log('Bot totalmente carregado'))

    // Configuração do Desligamento Seguro (Graceful Shutdown)
    const shutdown = async (signal) => {
        logger.log(`Recebido ${signal} - desligando graciosamente...`);

        bot.client.removeAllListeners();
        await bot.db.endConnection();
        await bot.client.destroy();

        logger.log('Desligamento completo');
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}
try {
    await main()
} catch (error) {
    logger.error("Falha fatal na inicialização do bot:", error);
    process.exit(1);
}
