import { WebhookController } from "../../controller/webhookController";

/* eslint-disable @typescript-eslint/explicit-function-return-type */
export default (webhookController: WebhookController) => ({
    "/api/v2/vacancy": (req: Request) => webhookController.postVacancy(req)
});