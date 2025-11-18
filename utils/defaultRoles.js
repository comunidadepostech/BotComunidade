// permissionOverwrites do comando /create
export const defaultRoles = {
    rolesForNewClasses: [
        {
            name: "Equipe Pós-Tech",
            allow: ["ViewChannel"],
            deny: []
        },
        {
            name: "Talent Lab",
            allow: ["ViewChannel"],
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
            allow: [
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
            allow: [
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
            allow: ["ViewChannel"],
            deny: ["SendPolls"]
        }
    ]
}