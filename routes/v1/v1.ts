import { Router } from 'express';
import criarEventoRouter from "./criarEvento.routes.ts";
import sendLivePoll from "./sendLivePoll.ts";
import sendWarning from "./sendWarning.ts";

const v1 = Router();

v1.use('/criarEvento', criarEventoRouter);
v1.use('/enviarForms', sendLivePoll);
v1.use('/sendWarning', sendWarning);

export default v1;