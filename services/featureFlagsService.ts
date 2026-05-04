import type { IFlagsRepository } from '../types/repository.interfaces.ts';
import type { UpdateFeatureFlagDTO } from '../dtos/updateFlag.dto.ts';
import type { GlobalFlags, IGuildFlags } from '../types/featureFlags.types.ts';
import { NotFoundError } from '../types/errors.ts';

/**
 * FeatureFlagsService - Gerencia o estado e as atualizações das flags de funcionalidade
 * Implementa a interface IFeatureFlagsService
 *
 * Responsabilidades:
 * - Colocar as flags de funcionalidade em cache na memória para acesso rápido
 * - Lidar com as atualizações de flags com validação
 * - Persistir as alterações no repositório
 *
 * Padrão de Projeto (Design Pattern): Localizador de Serviço (Service Locator) com injeção de repositório
 * Garante baixo acoplamento e facilidade de testes
 *
 * SOLID:
 * - Responsabilidade Única (Single Responsibility): Apenas gerencia as flags de funcionalidade
 * - Inversão de Dependência (Dependency Inversion): Depende da interface IFlagsRepository
 * - Aberto/Fechado (Open/Closed): Fácil de estender com novos tipos de flags
 */
export default class FeatureFlagsService {
    /**
     * Cache em memória de todas as flags de funcionalidade
     * Fornece busca rápida sem consultas ao banco de dados
     */
    private globalFlags: GlobalFlags;

    constructor(
        initialFlags: GlobalFlags,
        private flagsRepository: IFlagsRepository,
    ) {
        this.globalFlags = initialFlags;
    }

    /**
     * Atualiza uma ou mais flags de funcionalidade para um servidor (guild)
     * Valida se as flags existem antes de atualizar
     * Persiste as alterações no banco de dados
     *
     * @param dto - Solicitação de atualização com guildId, nome(s) da(s) flag(s) e novo valor
     * @throws ValidationError se o servidor não for encontrado
     * @throws NotFoundError se a flag não existir
     */
    async updateFlag(dto: UpdateFeatureFlagDTO): Promise<void> {
        // Validar se o servidor existe
        if (!this.globalFlags[dto.guildId]) {
            throw new NotFoundError(`Guild ${dto.guildId} not found`, 'Guild');
        }

        // Lidar tanto com uma única flag quanto com um array de flags
        const flagNames = Array.isArray(dto.flagName) ? dto.flagName : [dto.flagName];

        // Validar se todas as flags existem antes de atualizar qualquer uma
        for (const flagName of flagNames) {
            if (!(flagName in this.globalFlags[dto.guildId]!)) {
                throw new NotFoundError(
                    `Feature flag '${flagName}' not found in guild ${dto.guildId}`,
                    'FeatureFlag',
                );
            }
        }

        // Atualizar as flags no cache e no banco de dados
        for (const flagName of flagNames) {
            this.globalFlags[dto.guildId]![flagName as keyof IGuildFlags] = dto.flagValue;
            await this.flagsRepository.updateFeatureFlag(dto.guildId, flagName, dto.flagValue);
        }
    }

    /**
     * Verifica se uma funcionalidade está habilitada para um servidor
     * Retorna false se o servidor ou a flag não existir
     *
     * @param guildId - ID do servidor para verificar
     * @param flag - Nome da flag para verificar
     * @returns true se a flag estiver habilitada, false caso contrário
     */
    isEnabled(guildId: string, flag: keyof IGuildFlags): boolean {
        return this.globalFlags[guildId]?.[flag] ?? false;
    }

    /**
     * Recupera o valor da flag para um servidor
     * Alias para isEnabled para clareza semântica
     *
     * @param guildId - ID do servidor para verificar
     * @param flag - Nome da flag para verificar
     * @returns Valor da flag ou false se não for encontrado
     */
    getFlag(guildId: string, flag: keyof IGuildFlags): boolean {
        return this.globalFlags[guildId]?.[flag] ?? false;
    }

    /**
     * Recupera todas as flags de um servidor específico
     *
     * @param guildId - ID do servidor para o qual recuperar as flags
     * @returns Objeto de flags do servidor ou undefined se o servidor não for encontrado
     */
    getGuildFlags(guildId: string): IGuildFlags | undefined {
        return this.globalFlags[guildId];
    }

    /**
     * Recupera todas as flags globais de todos os servidores
     *
     * @returns Todas as flags de todos os servidores
     */
    get flags(): GlobalFlags {
        return this.globalFlags;
    }

    /**
     * Substitui todas as flags (usado para operações de atualização/refresh)
     * Raramente deve ser usado fora dos testes
     *
     * @param flags - Novas flags globais para definir
     */
    set flags(flags: GlobalFlags) {
        this.globalFlags = flags;
    }

    /**
     * Recarrega as flags de funcionalidade do banco de dados
     * Usado quando as flags podem ter sido atualizadas por outra instância
     */
    async refreshFlags(): Promise<void> {
        this.globalFlags = await this.flagsRepository.getAllFeatureFlags();
    }
}
