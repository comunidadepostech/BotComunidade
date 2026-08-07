export default interface IThreadProvider {
    /**
     * Create a new thread inside a specified channel.
     *
     * @param channelId The ID of the channel
     * @param threadName The name of the new thread
     * @param message The initial thread message
     */
    createThread(channelId: string, threadName: string, message: string): Promise<string>;
}
