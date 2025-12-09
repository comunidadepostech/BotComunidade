import express from 'express';
import handleCreateEvent from './services/createEvent.js';
import logger from "../utils/logger.js";
import Bot from "../bot.js";
import handleSendLivePoll from "./services/sendLivePoll.js";
import removeEvent from "./services/removeEvent.js";

// Para adicionar outro serviço em um novo endpoint, faça o seguinte:
// 1. Crie o arquivo com a lógica (ex: './updateEvent.js')
// 2. Importe a função dele: import { handleUpdateEvent } from './updateEvent.js';
// 3. Adicione a rota assim:
// this.app.post('/atualizarEvento', (req, res) => {
//     handleUpdateEvent(req, res, client);
// });

export default class Webhook {
    private app: express.Application;
    readonly port: string;
    constructor() {
        this.app = express();
        this.port = process.env.PRIMARY_WEBHOOK_PORT!;
    }

    start(bot: Bot) {
        this.app.use(express.json());

        this.app.post('/criarEvento', async (req, res) => {
            try {
                const eventID: string = await handleCreateEvent(req, res, bot);
                logger.log(`Evento criado com sucesso`);
                res.status(201).json({ status: 'sucesso', eventID: eventID});
            } catch (error: any) {
                logger.error(`Erro ao cadastrar evento: ${error}`);
                if (!res.headersSent) {
                    res.status(500).json({ status: 'erro', mensagem: JSON.stringify(error.message.json, null, 2) });
                }
            }
        });

        this.app.post('/enviarForms', async (req, res) => {
            try {
                await handleSendLivePoll(bot, req);
                res.status(201).json({ status: 'sucesso' });
            } catch (error: any) {
                logger.error(`Erro ao enviar link de feedback: ${error}`);
                if (!res.headersSent) {
                    res.status(500).json({ status: 'erro', mensagem: JSON.stringify(error.message.json, null, 2) });
                }
            }
        });

        this.app.post('/removerEvento', async (req, res) => {
            try {
                await removeEvent(bot, req);
                res.status(201).json({ status: 'sucesso' });
            } catch (error: any) {
                logger.error(`Erro ao remover evento: ${error}`);
                if (!res.headersSent) {
                    res.status(500).json({ status: 'erro', mensagem: JSON.stringify(error.message.json, null, 2) });
                }
            }
        });

        // Inicia o servidor para ouvir na porta definida
        this.app.listen(Number(this.port), "0.0.0.0", () => {
            logger.log(`Webhook iniciado na porta: ${this.port}`);
        });
    }
}


