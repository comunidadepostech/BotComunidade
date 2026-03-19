import { Router } from 'express';
import messageRouter from "./message.routes.ts";
import eventRouter from "./event.routes.ts";
import vacancyRouter from "./vacancy.routes.ts";

const v2 = Router();

v2.use('/event', eventRouter);
v2.use('/message', messageRouter);
v2.use('/vacancy', vacancyRouter);

export default v2;