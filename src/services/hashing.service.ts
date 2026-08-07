import type IHashingService from '../types/services/hashingService.interface';

export default class HashingService implements IHashingService {
    generatePollHash(createdAtMonth: string, createdAtYear: string, pollQuestion: string): string {
        return Bun.SHA1.hash(createdAtYear + createdAtMonth + pollQuestion, 'hex');
    }
}
