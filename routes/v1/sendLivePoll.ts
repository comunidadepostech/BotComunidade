import { Router } from 'express';

const sendLivePollRouter = Router();

sendLivePollRouter.post('/', async (req, res) => {
    await req.webhookController.SendLivePoll(req, res);
});

export default sendLivePollRouter;