// permissionOverwrites do comando /create
export const defaultRoles = {
    rolesForNewClasses: [
        {
            name: "Equipe Pós-Tech",
            permissions: ["ViewChannel"],
            deny: []
        },
        {
            name: "Talent Lab",
            permissions: ["ViewChannel"],
            deny: []
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
            ],
            deny: []
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
            ],
            deny: []
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
            ],
            deny: []
        },
        {
            name: "className",
            permissions: ["ViewChannel"],
            deny: ["SendPolls"]
        }
    ]
}