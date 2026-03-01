import { Router } from 'express';

const vacancyRouter = Router();

vacancyRouter.post('/', (req, res) => {
    console.debug(req)
    res.json({ status: 'ok' });
});

export default vacancyRouter;