import { Router } from 'express';

const vacancyRouter = Router();

vacancyRouter.post('/', (req, res) => {
    console.debug(req)
    res.status(200).json({});
});

export default vacancyRouter;