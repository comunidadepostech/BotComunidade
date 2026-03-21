import { Router } from 'express';

const sendWarning = Router();

sendWarning.post('/', async (req, res) => {
    await req.webhookController.sendWarning(req, res)
});

export default sendWarning;