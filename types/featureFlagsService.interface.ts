import type { IGuildFlags, GlobalFlags } from './featureFlags.types.ts';
import type { UpdateFeatureFlagDTO } from '../dtos/updateFlag.dto.ts';

/**
 * Interface para o FeatureFlagsService
 * Define o contrato para gerenciar e verificar as flags de funcionalidade (feature flags) entre servidores (guilds)
 */
export default interface IFeatureFlagsService {
    /**
     * Atualiza uma ou mais flags de funcionalidade para um servidor
     */
    updateFlag(dto: UpdateFeatureFlagDTO): Promise<void>;

    /**
     * Verifica se uma funcionalidade está habilitada para um servidor
     */
    isEnabled(guildId: string, flag: keyof IGuildFlags): boolean;

    /**
     * Recupera o valor de uma flag para um servidor
     */
    getFlag(guildId: string, flag: keyof IGuildFlags): boolean;

    /**
     * Recupera todas as flags de um servidor específico
     */
    getGuildFlags(guildId: string): IGuildFlags | undefined;

    /**
     * Recupera todas as flags globais de todos os servidores
     */
    readonly flags: GlobalFlags;

    /**
     * Recarrega as flags de funcionalidade do banco de dados
     */
    refreshFlags(): Promise<void>;
}
