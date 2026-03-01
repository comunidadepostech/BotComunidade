import { Request, Response } from "express"; // Supondo Express
import { EventService } from "../../services/EventService";

export class WebhookController {
    static async createEvent(req: Request, res: Response) {
        try {
            const service = new EventService(client);

            await service.handleExternalEvent(req.body);

            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error(error);
            return res.status(400).json({ error: error.message });
        }
    }
}