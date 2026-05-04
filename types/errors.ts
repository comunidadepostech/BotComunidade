/**
 * Tipos de Erro Personalizados para tratamento consistente de erros em todas as camadas
 * Segue o padrão da classe Error e fornece informações de erro estruturadas
 */

/**
 * Classe de erro personalizada base que estende a classe Error
 * Todos os erros personalizados devem estender esta classe
 */
export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code: string,
    ) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Erro lançado quando a validação de entrada falha
 * Normalmente retorna 400 Bad Request
 */
export class ValidationError extends AppError {
    constructor(
        message: string,
        public readonly fieldErrors?: Record<string, string[]>,
    ) {
        super(400, message, 'VALIDATION_ERROR');
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/**
 * Erro lançado quando um recurso solicitado não é encontrado
 * Normalmente retorna 404 Not Found
 */
export class NotFoundError extends AppError {
    constructor(
        message: string,
        public readonly resourceType?: string,
    ) {
        super(404, message, 'NOT_FOUND');
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

/**
 * Erro lançado quando a autenticação/autorização falha
 * Normalmente retorna 401/403 Unauthorized ou Forbidden
 */
export class UnauthorizedError extends AppError {
    constructor(
        message: string = 'Unauthorized',
        public readonly isForbidden: boolean = false,
    ) {
        const statusCode = isForbidden ? 403 : 401;
        super(statusCode, message, isForbidden ? 'FORBIDDEN' : 'UNAUTHORIZED');
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

/**
 * Erro lançado quando operações de banco de dados falham
 * Normalmente retorna 500 Internal Server Error
 * Não deve expor detalhes do banco de dados aos clientes
 */
export class DatabaseError extends AppError {
    constructor(
        message: string,
        public readonly originalError?: Error,
        public readonly operation?: string,
    ) {
        super(500, message, 'DATABASE_ERROR');
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}

/**
 * Erro lançado quando chamadas de serviços externos falham (N8n, LinkedIn, etc.)
 * Normalmente retorna 502/503 Bad Gateway ou Service Unavailable
 */
export class ExternalServiceError extends AppError {
    constructor(
        message: string,
        public readonly serviceName: string,
        public readonly originalError?: Error,
    ) {
        super(503, message, 'EXTERNAL_SERVICE_ERROR');
        Object.setPrototypeOf(this, ExternalServiceError.prototype);
    }
}

/**
 * Erro lançado quando restrições de lógica interna são violadas
 * Normalmente retorna 500 Internal Server Error
 */
export class LogicError extends AppError {
    constructor(
        message: string,
        public readonly reason?: string,
    ) {
        super(500, message, 'LOGIC_ERROR');
        Object.setPrototypeOf(this, LogicError.prototype);
    }
}

/**
 * Type guard para verificar se um erro é um AppError
 */
export const isAppError = (error: unknown): error is AppError => {
    return error instanceof AppError;
};
