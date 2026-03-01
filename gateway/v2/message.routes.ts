import { Router } from 'express';

const messageRouter = Router();

messageRouter.post('/warning', (req, res) => {
    // Chame aqui seu Controller ou Service
    res.json({ version: 'v1', status: 'ok' });
});

messageRouter.post("/liveForms", (req, res) => {
    res.sendStatus(204)
})

export default messageRouter;