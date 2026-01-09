import {GlobalFonts} from '@napi-rs/canvas'
import Bot from "./bot.ts";
import logger from "./utils/logger.ts";


// Carrega as variáveis de ambiente
GlobalFonts.registerFromPath("./assets/Coolvetica Hv Comp.otf", "normalFont");
logger.log("Fonte carregada com sucesso. Iniciando o bot...")

async function main() {
    const bot = new Bot();

    // Conexão com Banco de Dados e verificação/criação de tabelas
    await bot.db.connect(process.env.MYSQL_URL as string)
        .then(() => logger.log('Conexão com o banco de dados estabelecida'))
        .catch(error => {throw new Error(`Falha ao conectar ao banco de dados: ${JSON.stringify(error, null, 2)}`)})

    await bot.db.verifyTables()
        .then(() => logger.log("Tabelas verificadas"));

    // Carrega as flags do banco de dados
    bot.flags = await bot.db.getFlags();

    // Login
    await bot.login(process.env.TOKEN as string)
        .then(() => logger.log('Bot conectado ao Discord'))
        .catch(error => {throw new Error(`ERRO - Falha ao conectar ao Discord: ${error}`)});

    bot.webhook.start(bot);

    // Verificação de flags
    let checkState = true
    while (checkState) {
        checkState = await bot.db.checkFlags(bot.flags, bot.defaultFlags, bot.client)
        bot.flags = await bot.db.getFlags()
    }
    logger.log("Todas as flags foram verificadas")

    // Prepara o bot
    await bot.build().then(() => logger.log('Bot totalmente carregado'))

    // Inicia o scheduler de eventos
    await bot.scheduler.start()
    logger.log("Scheduler iniciado")

    // Configuração do Desligamento Seguro (Graceful Shutdown)
    const shutdown = async (signal: string) => {
        logger.log(`Recebido ${signal} - desligando graciosamente...`);

        bot.client.removeAllListeners();
        bot.clearCommands()
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
    logger.error(`Falha fatal na inicialização do bot: ${error}`);
    process.exit(1);
}
