export default interface IInviteProvider {
    /**
     * Create a new invite link for a channel.
     *
     * @param maxAge The invite expiration time in seconds
     * @param maxUses The maximum number of uses for the invite
     * @param channelId The ID of the channel to create the invite in
     * @param guaranteedRoleId Optional role ID that should be guaranteed access
     * @param options Additional invite options
     */
    createInvite(
        maxAge: number,
        maxUses: number,
        channelId: string,
        guaranteedRoleId?: string,
        options?: {
            temporary?: boolean;
            unique?: boolean;
            reason?: string;
        },
    ): Promise<string>;
}
