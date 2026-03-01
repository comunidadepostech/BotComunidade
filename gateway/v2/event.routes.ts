import { Router } from 'express';

const eventRouter = Router();

eventRouter.post('/', (req, res) => {
    // Chame aqui seu Controller ou Service
    res.json({ version: 'v2', status: 'ok' });
});

eventRouter.delete("/", (req, res) => {
    res.sendStatus(204)
})

export default eventRouter;