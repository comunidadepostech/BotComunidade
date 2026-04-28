/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { WebhookController } from "../controller/webhookController.ts";
import v1 from "./v1/v1.ts";
import v2 from "./v2/v2.ts";

export default (webhookController: WebhookController) => ({
    ...v1(webhookController),
    ...v2(webhookController),
});