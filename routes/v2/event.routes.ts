/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { WebhookController } from "../../controller/webhookController.ts";

export default (webhookController: WebhookController) => ({
    "/api/v2/event": {
        POST:   (req: Request) => webhookController.EventManagement(req),
        DELETE: ()             => new Response(null, { status: 204 }),
    },
});