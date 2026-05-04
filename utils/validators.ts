/**
 * Utilitários de Validação para validação de entrada em toda a aplicação
 * Centraliza a lógica de validação para garantir consistência e princípios SOLID
 */

import { ValidationError, UnauthorizedError } from '../types/errors.ts';

/**
 * Estrutura de dados de entrada para validação de eventos
 */
export interface EventValidationInput {
    eventName: string;
    startDate: string;
    endDate: string;
    courseCode: string;
    type: string;
    link?: string;
}

/**
 * Resultado de validação genérico com informações de erro em nível de campo
 */
export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string[]>;
}

/**
 * Validador de Entrada - contém lógica de validação para várias entradas
 */
export class InputValidator {
    /**
     * Comprimento máximo para nomes de eventos no Discord (100 caracteres)
     */
    private static readonly MAX_EVENT_NAME_LENGTH = 100;

    /**
     * Valida a entrada de criação de eventos
     * Garante que todos os campos obrigatórios estejam presentes e sejam válidos
     * Lança ValidationError se a validação falhar
     */
    // eslint-disable-next-line complexity
    static validateEventInput(input: EventValidationInput): void {
        const errors: Record<string, string[]> = {};

        // Validar nome do evento
        if (!input.eventName?.trim()) {
            errors.eventName = ['Event name is required'];
        } else if (input.eventName.length > this.MAX_EVENT_NAME_LENGTH) {
            errors.eventName = [
                `Event name cannot exceed ${this.MAX_EVENT_NAME_LENGTH} characters`,
            ];
        }

        // Validar datas
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        if (isNaN(startDate.getTime())) {
            errors.startDate = ['Start date must be a valid ISO 8601 date'];
        }

        if (isNaN(endDate.getTime())) {
            errors.endDate = ['End date must be a valid ISO 8601 date'];
        }

        // Verificar se a data de início não está no passado
        if (!isNaN(startDate.getTime()) && startDate.getTime() < Date.now()) {
            errors.startDate = ['Start date cannot be in the past'];
        }

        // Verificar se a data de término é após a data de início
        if (
            !isNaN(startDate.getTime()) &&
            !isNaN(endDate.getTime()) &&
            endDate.getTime() < startDate.getTime()
        ) {
            errors.endDate = ['End date must be after start date'];
        }

        // Validar código do curso
        if (!input.courseCode?.trim()) {
            errors.courseCode = ['Course code is required'];
        }

        // Validar tipo de evento
        if (!input.type?.trim()) {
            errors.type = ['Event type is required'];
        }

        // Se houver erros, lançar ValidationError
        if (Object.keys(errors).length > 0) {
            throw new ValidationError('Event validation failed', errors);
        }
    }

    /**
     * Valida o token de webhook
     * Garante que o token corresponda ao valor esperado
     */
    static validateWebhookToken(token: string | null, expectedToken: string): void {
        if (!token || token !== expectedToken) {
            throw new UnauthorizedError('Invalid or missing webhook token');
        }
    }

    /**
     * Valida a entrada de mensagem de aviso
     */
    static validateWarningInput(message: string | undefined, courseCode: string | undefined): void {
        const errors: Record<string, string[]> = {};

        if (!message?.trim()) {
            errors.message = ['Warning message is required'];
        }

        if (!courseCode?.trim()) {
            errors.courseCode = ['Course code is required'];
        }

        if (Object.keys(errors).length > 0) {
            throw new ValidationError('Warning validation failed', errors);
        }
    }

    /**
     * Valida os dados de entrada da enquete
     */
    static validatePollInput(eventName: string | undefined): void {
        if (!eventName?.trim()) {
            throw new ValidationError(
                'Event identifier is required. Expected format: "Course - Event Name"',
            );
        }

        if (!eventName.includes(' - ')) {
            throw new ValidationError('Invalid event format. Expected: "Course - Event Name"');
        }
    }

    /**
     * Valida o formato do ID do servidor (guild)
     * IDs de servidor do Discord são números de 18 a 19 dígitos
     */
    static validateGuildId(guildId: string): void {
        if (!guildId || !/^\d{18,19}$/.test(guildId)) {
            throw new ValidationError('Invalid guild ID format');
        }
    }

    /**
     * Valida o formato do ID do usuário
     * IDs de usuário do Discord são números de 18 a 19 dígitos
     */
    static validateUserId(userId: string): void {
        if (!userId || !/^\d{18,19}$/.test(userId)) {
            throw new ValidationError('Invalid user ID format');
        }
    }
}

/**
 * Validador de Servidor - valida dados relacionados ao servidor (guild)
 */
export class GuildValidator {
    /**
     * Valida se as informações obrigatórias do servidor existem
     */
    static validateGuildExists(guildId: string | undefined): void {
        if (!guildId?.trim()) {
            throw new ValidationError('Guild ID is required');
        }
    }

    /**
     * Valida o formato do código do curso
     * Remove números do nome do curso para busca
     */
    static normalizeCourseCode(courseName: string): string {
        return courseName.replaceAll(/\d+/g, '').trim();
    }

    /**
     * Valida se o código do curso foi normalizado corretamente
     */
    static validateNormalizedCourseCode(normalized: string): void {
        if (!normalized || normalized.length === 0) {
            throw new ValidationError('Course code cannot be empty after normalization');
        }
    }
}

/**
 * Validador de Mensagem - valida o conteúdo da mensagem do Discord
 */
export class MessageValidator {
    private static readonly MAX_MESSAGE_LENGTH = 2000; // Limite de mensagem do Discord

    /**
     * Valida o conteúdo da mensagem antes de enviar
     */
    static validateMessageContent(message: string): void {
        if (!message?.trim()) {
            throw new ValidationError('Message content cannot be empty');
        }

        if (message.length > this.MAX_MESSAGE_LENGTH) {
            throw new ValidationError(
                `Message exceeds Discord limit of ${this.MAX_MESSAGE_LENGTH} characters`,
                { message: [`Message length: ${message.length}/${this.MAX_MESSAGE_LENGTH}`] },
            );
        }
    }
}
