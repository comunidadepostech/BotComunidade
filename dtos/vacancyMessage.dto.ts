export default interface VacancyMessageDto {
    role: string;
    role_type: string;
    employer: string;
    model: string | undefined;
    description: string | undefined;
    skills: string | undefined;
    locations: string[];
    salary: string | undefined;
    pub_date: string;
    end_date: string;
    ref_link: string;
    clusters: string[];
    role_level: string | undefined;
    how_to_apply: string | undefined;
}