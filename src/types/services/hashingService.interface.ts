export default interface IHashingService {
    /**
     * Generate a stable hash for a poll using creation date and question text.
     *
     * @param createdAtMonth The month when the poll was created
     * @param createdAtYear The year when the poll was created
     * @param pollQuestion The poll question text
     */
    generatePollHash(createdAtMonth: string, createdAtYear: string, pollQuestion: string): string;
}
