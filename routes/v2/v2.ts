/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { WebhookController } from "../../controller/webhookController.ts";
import eventRoutes   from "./event.routes.ts";
import messageRoutes from "./message.routes.ts";
import vacancyRoutes from "./vacancy.routes.ts";

export default (webhookController: WebhookController) => ({
    ...eventRoutes(webhookController),
    ...messageRoutes(webhookController),
    ...vacancyRoutes(),
});