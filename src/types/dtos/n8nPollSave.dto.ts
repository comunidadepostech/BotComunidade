export default interface N8NPollSaveDTO {
    created_by: string;
    guild: string;
    poll_category: string;
    poll_hash: string;
    question: string;
    answers: { response?: string; answers?: number }[];
    duration: string;
}
