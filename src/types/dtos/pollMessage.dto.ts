export default interface PollMessageDTO {
    question: string;
    answers: { text: string, emoji?: string }[];
    allowMultiSelect: boolean;
    duration: number;
}