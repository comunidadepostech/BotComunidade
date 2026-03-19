import { Router } from 'express';
import {WebhookController} from "../../controller/webhookController.ts";

const sendLivePollRouter = Router();

sendLivePollRouter.post('/', async (req, res) => {
    await WebhookController.SendLivePoll(req, res);
});

export default sendLivePollRouter;