import crypto from "node:crypto";

export default function generatePollHash(fullYear: string, month: string, content: string): string {
    // eslint-disable-next-line sonarjs/hashing
    return crypto.createHash('sha1').update(content + fullYear + month).digest('hex')
}