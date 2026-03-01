import {globalFlags} from "../entities/discordEntities.ts"
import DatabaseFlagsRepository from "../repositories/database/databaseFlagsRepository.ts";
import {UpdateFeatureFlagDTO} from "../entities/dto/updateFlagDTO.ts";

export default class FeatureFlagsService {
    constructor(private globalFlags: globalFlags) {}

    async updateFlag(dto: UpdateFeatureFlagDTO) {
        if (!this.globalFlags[dto.guildId]) throw new Error("Servidor não encontrado")

        // Verifica se todas as flags existem e depois atualiza (caso seja um array)
        if (dto.flagName instanceof Array) {
            for (const flag of dto.flagName) {
                if (!Object.keys(this.globalFlags[dto.guildId]!).includes(flag)) throw new Error(`Uma das flags não foi encontrada: ${flag}\nNada foi atualizado.`)
            }

            for (const flag of dto.flagName) {
                this.globalFlags[dto.guildId]![flag] = dto.flagValue
                await DatabaseFlagsRepository.updateFeatureFlag(dto.guildId, flag, dto.flagValue)
            }
            return
        }

        if (!Object.keys(this.globalFlags[dto.guildId]!).includes(dto.flagName)) throw new Error("Flag não encontrada")

        this.globalFlags[dto.guildId]![dto.flagName] = dto.flagValue
        await DatabaseFlagsRepository.updateFeatureFlag(dto.guildId, dto.flagName, dto.flagValue)
    }

    get flags(): globalFlags {
        return this.globalFlags
    }

    set flags(flags: globalFlags) {
        this.globalFlags = flags
    }
}