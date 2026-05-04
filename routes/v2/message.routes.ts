/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { WebhookController } from "../../controller/webhookController.ts";

export default (webhookController: WebhookController) => ({
    "/api/v2/message/warning":   (req: Request) => webhookController.sendWarning(req),
    "/api/v2/message/liveForms": (req: Request) => webhookController.SendLivePoll(req),
});