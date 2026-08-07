export default interface IWarningRepository {
    /**
     * Save a warning message record for an event.
     *
     * @param channelId The channel ID where the warning message is posted
     * @param messageId The warning message ID
     * @param eventId The associated event ID
     */
    saveWarningMessage(channelId: string, messageId: string, eventId: string): Promise<void>;

    /**
     * Delete a warning message record by message ID.
     *
     * @param messageId The ID of the warning message to delete
     */
    deleteWarningMessage(messageId: string): Promise<void>;

    /**
     * List all saved warning messages.
     */
    listWarningMessages(): { message_id: string; channel_id: string; event_id: string }[];

    /**
     * Synchronize warning messages, ensuring stored records match current state.
     */
    syncWarningMessages(): Promise<void>;
}
