import { describe, expect, it, mock, beforeEach } from "bun:test";
import FeatureFlagsService from "../services/featureFlagsService.ts";
import { NotFoundError } from "../types/errors.ts";
import type { IFlagsRepository } from "../types/repository.interfaces.ts";
import type { GlobalFlags } from "../types/featureFlags.types.ts";
import type { UpdateFeatureFlagDTO } from "../dtos/updateFlag.dto.ts";

describe("FeatureFlagsService", () => {
    let mockRepository: IFlagsRepository;
    let initialFlags: GlobalFlags;
    let service: FeatureFlagsService;

    const GUILD_ID = "123456789012345678";

    beforeEach(() => {
        initialFlags = {
            [GUILD_ID]: {
                salvar_interacoes: true,
                enviar_aviso_de_eventos: false,
                comecar_grupo_de_estudos_automaticamente: true,
                coletar_dados_de_membros_mensalmente: true,
                enviar_mensagem_de_boas_vindas: false,
                salvar_enquetes: true,
                enviar_forms_no_final_da_live: false
            }
        };

        mockRepository = {
            getAllFeatureFlags: mock(() => Promise.resolve(initialFlags)),
            saveDefaultFeatureFlags: mock(() => Promise.resolve()),
            updateFeatureFlag: mock(() => Promise.resolve()),
            deleteGuildFeatureFlags: mock(() => Promise.resolve()),
            checkEmptyFeatureFlags: mock(() => Promise.resolve())
        } as unknown as IFlagsRepository;

        service = new FeatureFlagsService(initialFlags, mockRepository);
    });

    describe("isEnabled", () => {
        it("should return true when a flag is enabled", () => {
            expect(service.isEnabled(GUILD_ID, "salvar_interacoes")).toBe(true);
        });

        it("should return false when a flag is disabled", () => {
            expect(service.isEnabled(GUILD_ID, "enviar_aviso_de_eventos")).toBe(false);
        });

        it("should return false when guild does not exist in cache", () => {
            expect(service.isEnabled("non-existent-guild", "salvar_interacoes")).toBe(false);
        });
    });

    describe("getFlag", () => {
        it("should return the correct boolean value for a flag", () => {
            expect(service.getFlag(GUILD_ID, "salvar_interacoes")).toBe(true);
            expect(service.getFlag(GUILD_ID, "enviar_aviso_de_eventos")).toBe(false);
        });
    });

    describe("getGuildFlags", () => {
        it("should return all flags for a specific guild", () => {
            const flags = service.getGuildFlags(GUILD_ID);
            expect(flags).toEqual(initialFlags[GUILD_ID]);
        });

        it("should return undefined if guild is not found", () => {
            expect(service.getGuildFlags("unknown")).toBeUndefined();
        });
    });

    describe("updateFlag", () => {
        it("should update a single flag in cache and repository", async () => {
            const dto: UpdateFeatureFlagDTO = {
                guildId: GUILD_ID,
                flagName: "enviar_aviso_de_eventos",
                flagValue: true
            };

            await service.updateFlag(dto);

            expect(service.isEnabled(GUILD_ID, "enviar_aviso_de_eventos")).toBe(true);
            expect(mockRepository.updateFeatureFlag).toHaveBeenCalledWith(GUILD_ID, "enviar_aviso_de_eventos", true);
        });

        it("should update multiple flags when flagName is an array", async () => {
            const dto: UpdateFeatureFlagDTO = {
                guildId: GUILD_ID,
                flagName: ["enviar_aviso_de_eventos", "salvar_interacoes"],
                flagValue: false
            };

            await service.updateFlag(dto);

            expect(service.isEnabled(GUILD_ID, "enviar_aviso_de_eventos")).toBe(false);
            expect(service.isEnabled(GUILD_ID, "salvar_interacoes")).toBe(false);
            expect(mockRepository.updateFeatureFlag).toHaveBeenCalledTimes(2);
        });

        it("should throw NotFoundError if guild does not exist", async () => {
            const dto: UpdateFeatureFlagDTO = {
                guildId: "invalid",
                flagName: "salvar_interacoes",
                flagValue: true
            };

            expect(service.updateFlag(dto)).rejects.toThrow(NotFoundError);
        });

        it("should throw NotFoundError if flag name is invalid", async () => {
            const dto: UpdateFeatureFlagDTO = {
                guildId: GUILD_ID,
                flagName: "invalid_flag" as any,
                flagValue: true
            };

            expect(service.updateFlag(dto)).rejects.toThrow(NotFoundError);
        });
    });

    describe("refreshFlags", () => {
        it("should update the local cache from the repository", async () => {
            const updatedFlags = { ...initialFlags };
            updatedFlags[GUILD_ID]!.salvar_interacoes = false;

            (mockRepository.getAllFeatureFlags as any).mockResolvedValue(updatedFlags);

            await service.refreshFlags();

            expect(service.isEnabled(GUILD_ID, "salvar_interacoes")).toBe(false);
            expect(mockRepository.getAllFeatureFlags).toHaveBeenCalled();
        });
    });
});
