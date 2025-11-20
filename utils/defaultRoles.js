import {PermissionsBitField} from "discord.js";

// permissionOverwrites do comando /create
export const defaultRoles = {
    rolesForNewClasses: [
        {
            name: "Equipe Pós-Tech",
            allow: [PermissionsBitField.Flags.ViewChannel],
            deny: []
        },
        {
            name: "Talent Lab",
            allow: [PermissionsBitField.Flags.ViewChannel],
            deny: []
        },
        {
            name: "Gestor acadêmico",
            permissions: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.CreatePublicThreads,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.AddReactions,
                PermissionsBitField.Flags.MentionEveryone,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.SendPolls,
                PermissionsBitField.Flags.UseVAD
            ],
            deny: []
        },
        {
            name: "Coordenação",
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.CreatePublicThreads,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.AddReactions,
                PermissionsBitField.Flags.MentionEveryone,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.SendPolls,
                PermissionsBitField.Flags.UseVAD
            ],
            deny: []
        },
        {
            name: "Professores",
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.CreatePublicThreads,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.AddReactions,
                PermissionsBitField.Flags.MentionEveryone,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.SendPolls,
                PermissionsBitField.Flags.UseVAD
            ],
            deny: []
        },
        {
            name: "className",
            allow: [PermissionsBitField.Flags.ViewChannel],
            deny: [PermissionsBitField.Flags.SendPolls]
        }
    ]
}