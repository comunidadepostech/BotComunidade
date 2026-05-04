import { describe, expect, it, mock, beforeEach } from "bun:test";
import N8nService from "../services/n8nService.ts";

// Mock the environment variables to avoid requireEnv errors in test environment
mock.module("../config/env.ts", () => ({
    env: {
        N8N_ENDPOINT: "https://n8n.test.com"
    }
}));

describe("N8nService", () => {
    let service: N8nService;
    const token = "test-token";

    beforeEach(() => {
        service = new N8nService(token);
        // Mock global fetch for each test
        global.fetch = mock(() =>
            Promise.resolve(new Response(JSON.stringify({ status: "ok" }), { status: 200 }))
        );
    });

    it("should use correct headers with the provided token", async () => {
        const poll = {
            created_by: "user",
            guild: "guild",
            poll_category: "cat",
            poll_hash: "hash",
            question: "q",
            answers: [],
            duration: "1"
        };

        await service.savePoll(poll);

        const fetchMock = global.fetch as any;
        const callArgs = fetchMock.mock.calls[0];
        const options = callArgs[1];

        expect(options.headers).toEqual({
            "Content-Type": "application/json",
            token: token
        });
    });

    describe("savePoll", () => {
        it("should send POST request to /salvarEnquete with correct payload", async () => {
            const poll = {
                created_by: "user",
                guild: "guild",
                poll_category: "cat",
                poll_hash: "hash",
                question: "q",
                answers: [{ response: "a", answers: 1 }],
                duration: "1"
            };

            await service.savePoll(poll);

            expect(global.fetch).toHaveBeenCalledWith(
                "https://n8n.test.com/salvarEnquete",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(poll)
                })
            );
        });

        it("should throw error if n8n returns a non-ok response for polls", async () => {
            global.fetch = mock(() => Promise.resolve(new Response("Internal Error", { status: 500 })));

            expect(service.savePoll({} as any)).rejects.toThrow(/Falha ao enviar enquete para o n8n/);
        });
    });

    describe("saveInteraction", () => {
        it("should send POST request to /salvarInteracao with interaction data", async () => {
            const interaction = {
                createdBy: "user",
                guild: "guild",
                message: "Hello world",
                timestamp: "2023-10-27T10:00:00Z",
                id: "123456789",
                authorRole: "Student",
                thread: null,
                channel: "general",
                class: "Turma A"
            };

            await service.saveInteraction(interaction);

            expect(global.fetch).toHaveBeenCalledWith(
                "https://n8n.test.com/salvarInteracao",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(interaction)
                })
            );
        });

        it("should throw error if n8n returns a non-ok response for interactions", async () => {
            global.fetch = mock(() => Promise.resolve(new Response("Bad Request", { status: 400 })));

            expect(service.saveInteraction({} as any)).rejects.toThrow(/Falha ao enviar interação para o n8n/);
        });
    });

    describe("saveStudyGroupAnalysis", () => {
        it("should send POST request to /salvarDadosGrupoEstudo", async () => {
            const payload = {
                guildId: "123",
                membersInVoice: 5,
                timestamp: new Date().toISOString()
            } as any;

            await service.saveStudyGroupAnalysis(payload);

            expect(global.fetch).toHaveBeenCalledWith(
                "https://n8n.test.com/salvarDadosGrupoEstudo",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(payload)
                })
            );
        });

        it("should throw error if n8n returns a non-ok response for study group analysis", async () => {
            global.fetch = mock(() => Promise.resolve(new Response("Error", { status: 500 })));

            expect(service.saveStudyGroupAnalysis({} as any)).rejects.toThrow(/Falha ao enviar dados do grupo de estudo/);
        });
    });

    describe("saveRolesMembersCount", () => {
        it("should send POST request to /salvarMembros", async () => {
            const payload = [
                { guildName: "Guild 1", roleName: "Role A", count: 100 },
                { guildName: "Guild 1", roleName: "Role B", count: 50 }
            ];

            await service.saveRolesMembersCount(payload);

            expect(global.fetch).toHaveBeenCalledWith(
                "https://n8n.test.com/salvarMembros",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify(payload)
                })
            );
        });

        it("should throw error if n8n returns a non-ok response for member count", async () => {
            global.fetch = mock(() => Promise.resolve(new Response("Error", { status: 500 })));

            expect(service.saveRolesMembersCount([])).rejects.toThrow(/Erro ao enviar dados de quantidade de membros/);
        });
    });

    describe("saveOnlineMembers", () => {
        it("should send POST request to /salvarMembrosOnline wrapped in an object", async () => {
            const count = 150;

            await service.saveOnlineMembers(count);

            expect(global.fetch).toHaveBeenCalledWith(
                "https://n8n.test.com/salvarMembrosOnline",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ count: count })
                })
            );
        });

        it("should throw error if n8n returns a non-ok response for online members", async () => {
            global.fetch = mock(() => Promise.resolve(new Response("Error", { status: 500 })));

            expect(service.saveOnlineMembers(0)).rejects.toThrow(/Erro ao enviar dados de membros online/);
        });
    });
});
