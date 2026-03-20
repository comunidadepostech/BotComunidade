import { Router } from 'express';

const messageRouter = Router();

messageRouter.post('/warning', async (req, res) => {
    await req.webhookController.sendWarning(req, res)
});

messageRouter.post("/liveForms", async (req, res) => {
    await req.webhookController.SendLivePoll(req, res);
})

export default messageRouter;