import { Router } from 'express';
import {WebhookController} from "../../controller/webhookController.ts";

const eventRouter = Router();

eventRouter.post('/', async (req, res) => {
    await WebhookController.EventManagement(req, res);
});

eventRouter.delete("/", (req, res) => {
    res.sendStatus(204)
})

export default eventRouter;