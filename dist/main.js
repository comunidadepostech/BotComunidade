var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GlobalFonts } from '@napi-rs/canvas';
import { Bot } from "./bot.js";
import logger from "./utils/logger.js";
import fs from "node:fs";
// Carrega as variáveis de ambiente
if (fs.existsSync("./.env"))
    process.loadEnvFile("./.env");
GlobalFonts.registerFromPath("./assets/Coolvetica Hv Comp.otf", "normalFont");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const bot = new Bot();
        // Conexão com Banco de Dados
        yield bot.db.connect(process.env.MYSQL_URL)
            .then(() => logger.log('Conexão com o banco de dados estabelecida'))
            .catch(error => { logger.error('Falha ao conectar ao banco de dados:', error.message); process.exit(0); });
        yield bot.db.verifyTables()
            .then(() => logger.log("Tabelas verificadas"));
        bot.flags = yield bot.db.getFlags();
        // Login
        yield bot.login(process.env.TOKEN)
            .then(() => logger.log('Bot conectado ao Discord'))
            .catch(error => logger.error('ERRO - Falha ao conectar ao Discord:', error.message));
        bot.webhook.start(bot);
        // Verificação de flags
        let checkState = true;
        while (checkState) {
            checkState = yield bot.db.checkFlags(bot.flags, bot.defaultFlags, bot.client);
            bot.flags = yield bot.db.getFlags();
        }
        logger.log("Todas as flags foram verificadas");
        yield bot.scheduler.start();
        logger.log("Scheduler iniciado");
        yield bot.build().then(() => logger.log('Bot totalmente carregado'));
        // Configuração do Desligamento Seguro (Graceful Shutdown)
        const shutdown = (signal) => __awaiter(this, void 0, void 0, function* () {
            logger.log(`Recebido ${signal} - desligando graciosamente...`);
            bot.client.removeAllListeners();
            yield bot.db.endConnection();
            yield bot.client.destroy();
            logger.log('Desligamento completo');
            process.exit(0);
        });
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    });
}
try {
    await main();
}
catch (error) {
    logger.error("Falha fatal na inicialização do bot:", error);
    process.exit(1);
}
