export type Attachment = Buffer | {
    url: string;
    name: string;
    contentType?: string | null;
}