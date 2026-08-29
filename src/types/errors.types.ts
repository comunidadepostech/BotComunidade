export class AppError extends Error {
    public readonly statusCode: number | undefined;

    constructor(message: string, statusCode?: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ChannelNotFoundError extends AppError {
    constructor(channelNameOrId: string, event: string) {
        super(`Channel ${channelNameOrId} not found during ${event} execution`);
    }
}

export class GuildNotFoundError extends AppError {
    constructor(guildNameOrId: string, event: string) {
        super(`Guild ${guildNameOrId} not found during ${event} execution`);
    }
}

export class RoleNotFoundError extends AppError {
    constructor(RoleNameOrId: string, event: string) {
        super(`Role ${RoleNameOrId} not found during ${event} execution`);
    }
}

export class InvalidChannelTypeError extends AppError {
    constructor(ChannelType: string, event: string) {
        super(`Channel Type ${ChannelType} is not supported during ${event} execution`);
    }
}

export class IncompatibleChannelError extends AppError {
    constructor(channelType: string, expectedChanneltype: string, event: string) {
        super(`Incompatible ${channelType} during ${event} execution, expected type: ${expectedChanneltype}`);
    }
}

export class CommandNotFoundError extends AppError {
    constructor(commandName: string, event: string) {
        super(`Command ${commandName} not found during ${event} execution`);
    }
}

export class FlagNotFoundError extends AppError {
    constructor(flag: string, event: string) {
        super(`Flag ${flag} not found during ${event} execution`);
    }
}

export class SomeBatchError extends AppError {
    constructor(failures: number, total?: number) {
        super(`Batch execution done with ${failures} failures ${total ? ' of total ' + total : ''} tasks.`);
    }
}

export class EmptyGuildError extends AppError {
    constructor(guildIdOrName: string) {
        super(`Guild ${guildIdOrName} is empty or has no visible channels.`);
    }
}

export class NetworkError extends AppError {
    constructor(endpoint: string, event: string, statusCode: number) {
        super(
            `Network error occurred while accessing ${endpoint} with status code ${statusCode} during ${event} execution.`,
        );
    }
}

export class EventNotFoundError extends AppError {
    constructor(eventNameOrId: string, event: string) {
        super(`Event "${eventNameOrId}" was not found during ${event} execution`);
    }
}

export class InvalidCourseNameError extends AppError {
    constructor(courseName: string, event: string) {
        super(`The course name "${courseName}" was not found during ${event} execution`);
    }
}

export class MessageNotFoundError extends AppError {
    constructor(messageId: string, channelNameOrId: string, event: string) {
        super(`The message id ${messageId} was not found in ${channelNameOrId} during ${event} execution`);
    }
}

export class MemberNotFoundError extends AppError {
    constructor(memberNameOrId: string, guildNameOrId: string, event: string) {
        super(`Member ${memberNameOrId} was not found in ${guildNameOrId} during ${event} execution`);
    }
}
