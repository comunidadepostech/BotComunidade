import z from 'zod';
import env from '../config/env';
import { AppError } from '../types/errors.types';
import type ILoggerService from '../types/services/loggerService.interface';

export async function validateWebhookRequest<T>(req: Request, schema: z.Schema<T>, logger: ILoggerService): Promise<T> {
    if (req.headers.get('Authorization') !== 'Bearer ' + env.WEBHOOK_TOKEN) {
        throw new AppError('Not authorized or authorization missing', 401);
    }

    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
        throw new AppError(JSON.stringify({ status: 'error', error: z.prettifyError(result.error) }), 400);
    }

    logger.http('Received request', { body: result.data });
    return result.data;
}
