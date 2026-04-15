/* eslint-disable @typescript-eslint/explicit-function-return-type */
import sendLivePoll from "./sendLivePoll";
import sendWarning from "./sendWarning";
import criarEvento from "./criarEvento.routes";
import { WebhookController } from "../../controller/webhookController";

export default (webhookController: WebhookController) => ({
    ...sendLivePoll(webhookController),
    ...sendWarning(webhookController),
    ...criarEvento(webhookController),
});