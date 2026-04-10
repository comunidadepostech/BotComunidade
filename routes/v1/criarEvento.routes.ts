/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { WebhookController } from "../../controller/webhookController.ts";

export default (webhookController: WebhookController) => ({
    "/api/v1/criarEvento": {
        POST:   (req: Request) => webhookController.EventManagement(req)
    },
});