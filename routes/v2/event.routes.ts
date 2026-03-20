import { Router } from 'express';

const eventRouter = Router();

eventRouter.post('/', async (req, res) => {
    await req.webhookController.EventManagement(req, res);
});

eventRouter.delete("/", (_req, res) => {
    res.sendStatus(500)
})

export default eventRouter;