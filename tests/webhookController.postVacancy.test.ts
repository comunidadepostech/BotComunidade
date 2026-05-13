import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { WebhookController } from '../controller/webhookController.ts';

// Mock environment variables
mock.module('../config/env.ts', () => ({
    env: {
        WEBHOOK_TOKEN: 'valid-token',
    },
}));

describe('WebhookController - postVacancy', () => {
    let controller: WebhookController;
    let mockClient: any;
    let mockFeatureFlagsService: any;
    let mockDiscordService: any;
    let mockGuildsRepository: any;

    beforeEach(() => {
        mockClient = {
            guilds: {
                fetch: mock(() => Promise.resolve(null)),
            },
        };

        mockFeatureFlagsService = {
            getFlag: mock(() => true),
        };

        mockDiscordService = {
            messages: {
                sendVacancyMessage: mock(() => Promise.resolve()),
            },
        };

        mockGuildsRepository = {
            getGuildIdByCourse: mock(() => 'guild-123'),
            getGuildIdsByCluster: mock(() => ['guild-123']),
        };

        controller = new WebhookController({
            client: mockClient,
            featureFlagsService: mockFeatureFlagsService,
            discordService: mockDiscordService,
            guildsRepository: mockGuildsRepository,
        });
    });

    const createRequest = (body: any, token = 'valid-token') => {
        return {
            json: async () => body,
            headers: {
                get: (name: string) => (name === 'token' ? token : null),
            },
        } as unknown as Request;
    };

    const validVacancyBody = {
        cargo: 'Senior Developer',
        tipo_de_emprego: 'Full-time',
        empregador: 'Tech Company',
        modelo: 'Remote',
        descricao: 'We are looking for a senior developer with 5+ years of experience',
        _skills: 'JavaScript, TypeScript, React',
        localizacoes: ['São Paulo', 'Rio de Janeiro'],
        _salario: 'R$ 10k - 15k',
        data_de_publicacao: '2024-01-01',
        data_de_termino: '2024-02-01',
        referencia: 'https://example.com/job/123',
        clusters: ['Dev'],
        nivel_de_vaga: 'Senior',
        como_aplicar: 'https://example.com/apply',
    };

    describe('Success scenarios', () => {
        it('should post a vacancy successfully', async () => {
            const response = await controller.postVacancy(createRequest(validVacancyBody));

            expect(response.status).toBe(200);
            expect(mockDiscordService.messages.sendVacancyMessage).toHaveBeenCalled();
        });

        it('should accept vacancy with multiple clusters', async () => {
            const body = {
                ...validVacancyBody,
                clusters: ['Dev', 'DevOps', 'QA'],
            };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(200);
        });

        it('should accept vacancy with maximum locations (9)', async () => {
            const body = {
                ...validVacancyBody,
                localizacoes: Array(9)
                    .fill(null)
                    .map((_, i) => `Location ${i + 1}`),
            };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(200);
        });

        it('should accept vacancy with description at maximum length (1500 chars)', async () => {
            const body = {
                ...validVacancyBody,
                descricao: 'a'.repeat(1500),
            };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(200);
        });

        it('should accept vacancy with minimum required fields', async () => {
            const minimalBody = {
                cargo: 'Developer',
                tipo_de_emprego: 'Full-time',
                empregador: 'Company',
                modelo: 'Remote',
                descricao: 'Job description',
                _skills: 'Skill1, Skill2',
                localizacoes: ['São Paulo'],
                _salario: 'R$ 5k - 10k',
                data_de_publicacao: '2024-01-01',
                data_de_termino: '2024-02-01',
                referencia: 'https://example.com/job',
                clusters: ['Dev'],
                nivel_de_vaga: 'Junior',
                como_aplicar: 'https://example.com/apply',
            };
            const response = await controller.postVacancy(createRequest(minimalBody));
            expect(response.status).toBe(200);
        });
    });

    describe('Authentication failures', () => {
        it('should return 401 if token is missing', async () => {
            const response = await controller.postVacancy(createRequest(validVacancyBody, null as any));
            expect(response.status).toBe(401);
        });

        it('should return 401 if token is invalid', async () => {
            const response = await controller.postVacancy(
                createRequest(validVacancyBody, 'wrong-token'),
            );
            expect(response.status).toBe(401);
        });
    });

    describe('Required field validation failures', () => {
        it('should return 400 if cargo is missing', async () => {
            const body = { ...validVacancyBody, cargo: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if tipo_de_emprego is missing', async () => {
            const body = { ...validVacancyBody, tipo_de_emprego: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if empregador is missing', async () => {
            const body = { ...validVacancyBody, empregador: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if modelo is missing', async () => {
            const body = { ...validVacancyBody, modelo: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if data_de_publicacao is missing', async () => {
            const body = { ...validVacancyBody, data_de_publicacao: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if data_de_termino is missing', async () => {
            const body = { ...validVacancyBody, data_de_termino: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if referencia is missing', async () => {
            const body = { ...validVacancyBody, referencia: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if nivel_de_vaga is missing', async () => {
            const body = { ...validVacancyBody, nivel_de_vaga: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if como_aplicar is missing', async () => {
            const body = { ...validVacancyBody, como_aplicar: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if clusters is empty', async () => {
            const body = { ...validVacancyBody, clusters: [] };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });
    });

    describe('Field constraints validation', () => {
        it('should return 400 if localizacoes has more than 9 items', async () => {
            const body = {
                ...validVacancyBody,
                localizacoes: Array(10)
                    .fill(null)
                    .map((_, i) => `Location ${i + 1}`),
            };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });

        it('should return 400 if descricao is longer than 1500 characters', async () => {
            const body = {
                ...validVacancyBody,
                descricao: 'a'.repeat(1501),
            };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
        });
    });

    describe('Response format', () => {
        it('should return JSON response on success', async () => {
            const response = await controller.postVacancy(createRequest(validVacancyBody));
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(typeof data).toBe('object');
        });

        it('should return error status on validation failure', async () => {
            const body = { ...validVacancyBody, cargo: '' };
            const response = await controller.postVacancy(createRequest(body));
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(typeof data).toBe('object');
        });
    });

    describe('Clusters mapping', () => {
        it('should pass clusters correctly to the vacancy message service', async () => {
            const body = {
                ...validVacancyBody,
                clusters: ['Dev', 'DevOps'],
            };
            await controller.postVacancy(createRequest(body));

            const callArgs = mockDiscordService.messages.sendVacancyMessage.mock.calls[0];
            expect(callArgs[0].clusters).toEqual(['Dev', 'DevOps']);
        });

        it('should map field names correctly from request to DTO', async () => {
            const body = {
                cargo: 'Test Role',
                tipo_de_emprego: 'Part-time',
                empregador: 'Test Employer',
                modelo: 'Hybrid',
                descricao: 'Test description',
                _skills: 'Test skills',
                localizacoes: ['São Paulo'],
                _salario: 'R$ 5k',
                data_de_publicacao: '2024-01-01',
                data_de_termino: '2024-02-01',
                referencia: 'https://test.com',
                clusters: ['Dev'],
                nivel_de_vaga: 'Mid',
                como_aplicar: 'https://test.com/apply',
            };

            await controller.postVacancy(createRequest(body));

            const callArgs = mockDiscordService.messages.sendVacancyMessage.mock.calls[0][0];
            expect(callArgs.role).toBe('Test Role');
            expect(callArgs.role_type).toBe('Part-time');
            expect(callArgs.employer).toBe('Test Employer');
            expect(callArgs.model).toBe('Hybrid');
            expect(callArgs.description).toBe('Test description');
            expect(callArgs.skills).toBe('Test skills');
            expect(callArgs.salary).toBe('R$ 5k');
            expect(callArgs.role_level).toBe('Mid');
            expect(callArgs.how_to_apply).toBe('https://test.com/apply');
        });
    });
});
