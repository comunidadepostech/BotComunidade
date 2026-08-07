export default interface RepositoryPollSaveDTO {
    poll_hash: string;
    guild_name: string;
    poll_question: string;
    category: string;
    response1_text: string;
    response1_value: number;
    response2_text: string;
    response2_value: number;
    response3_text?: string;
    response3_value?: number;
    response4_text?: string;
    response4_value?: number;
    response5_text?: string;
    response5_value?: number;
    response6_text?: string;
    response6_value?: number;
    response7_text?: string;
    response7_value?: number;
    response8_text?: string;
    response8_value?: number;
    response9_text?: string;
    response9_value?: number;
    response10_text?: string;
    response10_value?: number;
}