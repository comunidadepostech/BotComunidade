import { Router } from 'express';
import {WebhookController} from "../../controller/webhookController.ts";

const messageRouter = Router();

messageRouter.post('/warning', async (req, res) => {
    await WebhookController.sendWarning(req, res)
});

messageRouter.post("/liveForms", async (req, res) => {
    await WebhookController.SendLivePoll(req, res);
})

export default messageRouter;