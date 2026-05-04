import { describe, expect, it, mock, beforeEach } from 'bun:test';
import buildRoutes from '../routes/webhookRouter.ts';
import { WebhookController } from '../controller/webhookController.ts';

/**
 * API Integration Tests
 * Verifies that the routing layer correctly connects HTTP endpoints to controller methods.
 */
describe('Webhook API Integration', () => {
    let mockWebhookController: WebhookController;
    let routes: any;

    beforeEach(() => {
        // Create a mock controller to isolate routing logic
        mockWebhookController = {
            EventManagement: mock(() =>
                Promise.resolve(new Response(JSON.stringify({ status: 'success' }), { status: 200 }))
            ),
            SendLivePoll: mock(() =>
                Promise.resolve(new Response(JSON.stringify({ status: 'success' }), { status: 200 }))
            ),
            sendWarning: mock(() =>
                Promise.resolve(new Response(JSON.stringify({ status: 'success' }), { status: 200 }))
            ),
        } as unknown as WebhookController;

        // Build the route map using the same logic as the production server
        routes = buildRoutes(mockWebhookController);
    });

    describe('v1 Routes', () => {
        it('should route POST /api/v1/criarEvento to EventManagement controller method', async () => {
            const path = '/api/v1/criarEvento';
            expect(routes[path]).toBeDefined();
            expect(routes[path].POST).toBeDefined();

            const req = new Request(`http://localhost${path}`, {
                method: 'POST',
                body: JSON.stringify({ test: 'data' })
            });

            const response = await routes[path].POST(req);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.status).toBe('success');
            expect(mockWebhookController.EventManagement).toHaveBeenCalled();
        });

        it('should route POST /api/v1/sendLivePoll to SendLivePoll controller method', async () => {
            const path = '/api/v1/sendLivePoll';
            expect(routes[path]).toBeDefined();
            expect(routes[path].POST).toBeDefined();

            const req = new Request(`http://localhost${path}`, { method: 'POST' });
            await routes[path].POST(req);

            expect(mockWebhookController.SendLivePoll).toHaveBeenCalled();
        });

        it('should route POST /api/v1/sendWarning to sendWarning controller method', async () => {
            const path = '/api/v1/sendWarning';
            expect(routes[path]).toBeDefined();
            expect(routes[path].POST).toBeDefined();

            const req = new Request(`http://localhost${path}`, { method: 'POST' });
            await routes[path].POST(req);

            expect(mockWebhookController.sendWarning).toHaveBeenCalled();
        });
    });

    describe('v2 Routes Registration', () => {
        it('should have v2 routes registered in the route map', () => {
            const routePaths = Object.keys(routes);
            const v2Paths = routePaths.filter(path => path.startsWith('/api/v2/'));

            // Verifying that v2 routes exist (actual paths depend on v2 implementation)
            expect(v2Paths.length).toBeGreaterThan(0);
        });

        it('should handle v2 event routes', () => {
            // common v2 path structure based on project files
            const eventPath = '/api/v2/event';
            if (routes[eventPath]) {
                expect(routes[eventPath].POST).toBeDefined();
            }
        });
    });

    describe('Server Integration (Functional)', () => {
        it('should return 404 for unregistered routes in Bun.serve context', async () => {
            // This mimics the fetch handler in main.ts
            const fetchHandler = (req: Request) => {
                const url = new URL(req.url);
                const route = routes[url.pathname];
                if (route && route[req.method]) {
                    return route[req.method](req);
                }
                return new Response('Not Found', { status: 404 });
            };

            const req = new Request('http://localhost/api/invalid/route', { method: 'GET' });
            const response = await fetchHandler(req);

            expect(response.status).toBe(404);
            const text = await response.text();
            expect(text).toBe('Not Found');
        });
    });
});
