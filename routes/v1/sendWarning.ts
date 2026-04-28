/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { WebhookController } from "../../controller/webhookController.ts";

export default (webhookController: WebhookController) => ({
    "/api/v1/sendWarning": {
        POST:   (req: Request) => webhookController.sendWarning(req)
    },
});