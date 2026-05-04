/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { WebhookController } from "../../controller/webhookController.ts";

export default (webhookController: WebhookController) => ({
    "/api/v1/sendLivePoll": {
        POST:   (req: Request) => webhookController.SendLivePoll(req)
    },
});