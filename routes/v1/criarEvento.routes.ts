import { Router } from 'express';

const criarEventoRouter = Router();

criarEventoRouter.post('/', async (req, res) => {
    await req.webhookController.EventManagement(req, res);
});

export default criarEventoRouter;