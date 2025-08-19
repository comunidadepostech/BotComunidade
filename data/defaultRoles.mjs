// permissionOverwrites do comando /create
export const defaultRoles = {
    rolesForNewClasses: [
        {
            name: "Equipe Pós-Tech",
            permissions: ["ViewChannel"]
        },
        {
            name: "Talent Lab",
            permissions: ["ViewChannel"]
        },
        {
            name: "Gestor acadêmico",
            permissions: [
                "ViewChannel",
                "SendMessages",
                "CreatePublicThreads",
                "EmbedLinks",
                "AttachFiles",
                "AddReactions",
                "MentionEveryone",
                "ReadMessageHistory",
                "SendPolls"
            ]
        },
        {
            name: "Coordenação",
            permissions: [
                "ViewChannel",
                "SendMessages",
                "CreatePublicThreads",
                "EmbedLinks",
                "AttachFiles",
                "AddReactions",
                "MentionEveryone",
                "ReadMessageHistory",
                "SendPolls"
            ]
        },
        {
            name: "Professores",
            permissions: [
                "ViewChannel",
                "SendMessages",
                "CreatePublicThreads",
                "EmbedLinks",
                "AttachFiles",
                "AddReactions",
                "MentionEveryone",
                "ReadMessageHistory",
                "SendPolls"
            ]
        },
        {
            name: "className",
            permissions: ["ViewChannel"]
        }
    ]
}