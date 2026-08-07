import type { Channel } from '../channel.types';
import type { MessageAction } from '../component.types';

export default interface VacancyDTO {
    threads: Channel[];
    header: string[];
    body: string[];
    footer: string;
    title: string;
    actions: MessageAction[]
}
