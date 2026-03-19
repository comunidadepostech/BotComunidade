import { Router } from 'express';
import {WebhookController} from "../../controller/webhookController.ts";

const sendWarning = Router();

sendWarning.post('/', async (req, res) => {
    await WebhookController.sendWarning(req, res)
});

export default sendWarning;