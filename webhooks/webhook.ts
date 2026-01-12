import express from 'express';
import handleCreateEvent from './services/createEvent.ts';
import logger from "../utils/logger.ts";
import Bot from "../bot.ts";
import handleSendLivePoll from "./services/sendLivePoll.ts";
import removeEvent from "./services/removeEvent.ts";

interface RouteHandler {
    path: string;
    method: 'post' | 'get';
    handler: (bot: Bot, req: Request) => Promise<any>;
}

export default class Webhook {
    readonly app: express.Application;
    readonly port: string;
    private routes: RouteHandler[] = [
        {
            path: "/criarEvento",
            method: "post",
            handler: handleCreateEvent
        },
        {
            path: '/enviarForms',
            method: "post",
            handler: handleSendLivePoll
        },
        {
            path: '/removerEvento',
            method: "post",
            handler: removeEvent
        }
    ];

    constructor() {
        this.app = express();
        this.port = process.env.PRIMARY_WEBHOOK_PORT || '3000';
    }

    start(bot: Bot) {
        this.app.use(express.json());

        this.routes.forEach((route) => {
            this.app[route.method](route.path, async (req, res) => {
                try {
                    const result = await route.handler(bot, req);

                    const responsePayload = result ? {status: 'sucesso', data: result} : {status: 'sucesso'};

                    logger.log(`Rota ${route.path} executada com sucesso.`);
                    res.status(201).json(responsePayload);

                } catch (error: any) {
                    logger.error(`Erro ao processar ${route.path}: ${error.message}`);
                    if (!res.headersSent) {
                        const errorMsg = error.message || "Erro interno";
                        res.status(500).json({status: 'erro', mensagem: errorMsg});
                    }
                }
            });
        });

        this.app.listen(Number(this.port), "0.0.0.0", () => {
            logger.log(`Webhook iniciado na porta: ${this.port}`);
        });
    }
}

