export type Author = {
    id: string;
    username: string;
    discriminator: string;
    avatarURL: string | null;
    globalName: string | null;
};