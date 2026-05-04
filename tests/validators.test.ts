import { describe, expect, it } from 'bun:test';
import { InputValidator } from '../utils/validators.ts';
import { ValidationError, UnauthorizedError } from '../types/errors.ts';

describe('InputValidator', () => {
    describe('validateEventInput', () => {
        const validEvent = {
            eventName: 'Turma 1 - Aula de Reforço',
            startDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            endDate: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
            courseCode: 'T1',
            type: 'Mentoria',
            link: 'https://zoom.us/j/123456',
        };

        it('should pass for valid event input', () => {
            expect(() => InputValidator.validateEventInput(validEvent)).not.toThrow();
        });

        it('should throw ValidationError if eventName is empty', () => {
            const invalidEvent = { ...validEvent, eventName: '' };
            expect(() => InputValidator.validateEventInput(invalidEvent)).toThrow(ValidationError);
        });

        it('should throw ValidationError if eventName is too long', () => {
            const invalidEvent = { ...validEvent, eventName: 'a'.repeat(101) };
            expect(() => InputValidator.validateEventInput(invalidEvent)).toThrow(ValidationError);
        });

        it('should throw ValidationError if startDate is invalid', () => {
            const invalidEvent = { ...validEvent, startDate: 'invalid-date' };
            expect(() => InputValidator.validateEventInput(invalidEvent)).toThrow(ValidationError);
        });

        it('should throw ValidationError if startDate is in the past', () => {
            const invalidEvent = {
                ...validEvent,
                startDate: new Date(Date.now() - 3600000).toISOString(),
            };
            expect(() => InputValidator.validateEventInput(invalidEvent)).toThrow(ValidationError);
        });

        it('should throw ValidationError if endDate is before startDate', () => {
            const invalidEvent = {
                ...validEvent,
                startDate: new Date(Date.now() + 7200000).toISOString(),
                endDate: new Date(Date.now() + 3600000).toISOString(),
            };
            expect(() => InputValidator.validateEventInput(invalidEvent)).toThrow(ValidationError);
        });

        it('should throw ValidationError if courseCode is missing', () => {
            const invalidEvent = { ...validEvent, courseCode: '' };
            expect(() => InputValidator.validateEventInput(invalidEvent)).toThrow(ValidationError);
        });

        it('should throw ValidationError if type is missing', () => {
            const invalidEvent = { ...validEvent, type: '' };
            expect(() => InputValidator.validateEventInput(invalidEvent)).toThrow(ValidationError);
        });
    });

    describe('validateWebhookToken', () => {
        const expectedToken = 'secret-token';

        it('should pass if tokens match', () => {
            expect(() =>
                InputValidator.validateWebhookToken(expectedToken, expectedToken),
            ).not.toThrow();
        });

        it('should throw if token is missing', () => {
            expect(() => InputValidator.validateWebhookToken(null, expectedToken)).toThrow(
                UnauthorizedError,
            );
        });

        it('should throw if tokens do not match', () => {
            expect(() => InputValidator.validateWebhookToken('wrong-token', expectedToken)).toThrow(
                UnauthorizedError,
            );
        });
    });

    describe('validateWarningInput', () => {
        it('should pass for valid warning input', () => {
            expect(() =>
                InputValidator.validateWarningInput('Mensagem de aviso', 'T1'),
            ).not.toThrow();
        });

        it('should throw if message is empty', () => {
            expect(() => InputValidator.validateWarningInput('', 'T1')).toThrow(ValidationError);
        });

        it('should throw if courseCode is empty', () => {
            expect(() => InputValidator.validateWarningInput('Mensagem', '')).toThrow(
                ValidationError,
            );
        });
    });

    describe('validatePollInput', () => {
        it('should pass for valid poll format', () => {
            expect(() => InputValidator.validatePollInput('Turma 1 - Aula 01')).not.toThrow();
        });

        it('should throw if event name is empty', () => {
            expect(() => InputValidator.validatePollInput('')).toThrow(ValidationError);
        });

        it('should throw if event name does not contain the separator', () => {
            expect(() => InputValidator.validatePollInput('InvalidFormat')).toThrow(
                ValidationError,
            );
        });
    });

    describe('validateGuildId', () => {
        it('should pass for valid Discord guild ID', () => {
            expect(() => InputValidator.validateGuildId('123456789012345678')).not.toThrow();
        });

        it('should throw for invalid guild ID format', () => {
            expect(() => InputValidator.validateGuildId('abc')).toThrow(ValidationError);
            expect(() => InputValidator.validateGuildId('123')).toThrow(ValidationError);
        });
    });

    describe('validateUserId', () => {
        it('should pass for valid Discord user ID', () => {
            expect(() => InputValidator.validateUserId('123456789012345678')).not.toThrow();
        });

        it('should throw for invalid user ID format', () => {
            expect(() => InputValidator.validateUserId('abc')).toThrow(ValidationError);
        });
    });
});
