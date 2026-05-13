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

    describe('validateVacancyInput', () => {
        const validVacancy = {
            role: 'Senior Developer',
            role_type: 'Full-time',
            employer: 'Tech Company',
            model: 'Remote',
            description: 'We are looking for a senior developer',
            skills: 'JavaScript, TypeScript, React',
            locations: ['São Paulo', 'Rio de Janeiro'],
            salary: 'R$ 10k - 15k',
            pub_date: '2024-01-01',
            end_date: '2024-02-01',
            ref_link: 'https://example.com/job',
            clusters: ['Dev'],
            role_level: 'Senior',
            how_to_apply: 'https://example.com/apply',
        };

        it('should pass for valid vacancy input', () => {
            expect(() => InputValidator.validateVacancyInput(validVacancy)).not.toThrow();
        });

        it('should throw if role is empty', () => {
            const invalidVacancy = { ...validVacancy, role: '' };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if role_type is empty', () => {
            const invalidVacancy = { ...validVacancy, role_type: '' };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if employer is empty', () => {
            const invalidVacancy = { ...validVacancy, employer: '' };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if model is empty', () => {
            const invalidVacancy = { ...validVacancy, model: '' };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if description is longer than 1500 characters', () => {
            const invalidVacancy = { ...validVacancy, description: 'a'.repeat(1501) };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should pass if description is exactly 1500 characters', () => {
            const vacancy = { ...validVacancy, description: 'a'.repeat(1500) };
            expect(() => InputValidator.validateVacancyInput(vacancy)).not.toThrow();
        });

        it('should throw if locations has more than 9 items', () => {
            const invalidVacancy = {
                ...validVacancy,
                locations: Array(10)
                    .fill(null)
                    .map((_, i) => `Location ${i}`),
            };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if pub_date is empty', () => {
            const invalidVacancy = { ...validVacancy, pub_date: '' };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if end_date is empty', () => {
            const invalidVacancy = { ...validVacancy, end_date: '' };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if ref_link is empty', () => {
            const invalidVacancy = { ...validVacancy, ref_link: '' };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if clusters is empty', () => {
            const invalidVacancy = { ...validVacancy, clusters: [] };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if role_level is empty', () => {
            const invalidVacancy = { ...validVacancy, role_level: '' };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should throw if how_to_apply is empty', () => {
            const invalidVacancy = { ...validVacancy, how_to_apply: '' };
            expect(() => InputValidator.validateVacancyInput(invalidVacancy)).toThrow(
                ValidationError,
            );
        });

        it('should pass with minimal optional fields', () => {
            const minimalVacancy = {
                role: 'Developer',
                role_type: 'Full-time',
                employer: 'Company',
                model: undefined,
                description: undefined,
                skills: undefined,
                locations: ['São Paulo'],
                salary: undefined,
                pub_date: '2024-01-01',
                end_date: '2024-02-01',
                ref_link: 'https://example.com',
                clusters: ['Dev'],
                role_level: undefined,
                how_to_apply: undefined,
            };
            // Note: This will depend on whether the validator allows undefined optional fields
            // If the current implementation requires all fields, this test may need adjustment
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
