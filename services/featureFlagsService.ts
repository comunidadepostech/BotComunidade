import DatabaseFlagsRepository from "../repositories/database/databaseFlagsRepository.ts";
import type {UpdateFeatureFlagDTO} from "../dtos/updateFlag.dto.ts";
import type {GlobalFlags, IGuildFlags} from "../types/featureFlags.types.ts";

export default class FeatureFlagsService {
    constructor(private globalFlags: GlobalFlags, private databaseFlagsRepository: DatabaseFlagsRepository) {}

    async updateFlag(dto: UpdateFeatureFlagDTO): Promise<void> {
        if (!this.globalFlags[dto.guildId]) throw new Error("Servidor não encontrado")

        // Verifica se todas as flags existem e depois atualiza (caso seja um array)
        if (dto.flagName instanceof Array) {
            for (const flag of dto.flagName) {
                if (!Object.keys(this.globalFlags[dto.guildId]!).includes(flag)) throw new Error(`Uma das flags não foi encontrada: ${flag}\nNada foi atualizado.`)
            }

            for (const flag of dto.flagName) {
                this.globalFlags[dto.guildId]![flag] = dto.flagValue
                await this.databaseFlagsRepository.updateFeatureFlag(dto.guildId, flag, dto.flagValue)
            }
            return
        }

        if (!Object.keys(this.globalFlags[dto.guildId]!).includes(dto.flagName)) throw new Error("Flag não encontrada")

        this.globalFlags[dto.guildId]![dto.flagName] = dto.flagValue
        await this.databaseFlagsRepository.updateFeatureFlag(dto.guildId, dto.flagName, dto.flagValue)
    }

    isEnabled(guildId: string, flag: keyof IGuildFlags): boolean {
        return this.globalFlags[guildId]?.[flag] ?? false;
    }

    getFlag(guildId: string, flag: keyof IGuildFlags): boolean {
        return this.globalFlags[guildId]?.[flag] ?? false;
    }

    getGuildFlags(guildId: string): IGuildFlags | undefined {
        return this.globalFlags[guildId];
    }

    get flags(): GlobalFlags {
        return this.globalFlags
    }

    set flags(flags: GlobalFlags) {
        this.globalFlags = flags
    }
}