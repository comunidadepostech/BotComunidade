import type { Message } from '../message.type';
import type { Role } from '../role.type';

export default interface MessageSaveDTO {
    threadName: string | null;
    message: Message;
    category: string | null;
    role: Role
}