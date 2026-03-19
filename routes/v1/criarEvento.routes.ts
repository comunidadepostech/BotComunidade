import { Router } from 'express';
import {WebhookController} from "../../controller/webhookController.ts";

const criarEventoRouter = Router();

criarEventoRouter.post('/', async (req, res) => {
    await WebhookController.EventManagement(req, res);
});

export default criarEventoRouter;