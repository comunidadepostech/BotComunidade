export default interface IImageProvider {
    /**
     * Generate a welcome image with user name, avatar URL, and message.
     *
     * @param memberName The name of the member
     * @param memberAvatarURL The avatar image URL
     * @param welcomeMessage The welcome message text
     */
    generateWelcomeImage(memberName: string, memberAvatarURL: string, welcomeMessage: string): Promise<Buffer>;
}
