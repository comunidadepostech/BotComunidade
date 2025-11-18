import { BaseCommand } from './baseCommand.js';
import {MessageFlags, PermissionFlagsBits, SlashCommandBuilder} from 'discord.js';
import {
    allPermissionsChannels,
    classActivations,
    classChannels,
    classRolePermissions,
    somePermissionsChannels
} from "../utils/classPatterns.js";
import {defaultRoles} from "../utils/defaultRoles.js";
import {defaultTags} from "../utils/defaultTags.js";

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class CreateClassCommand extends BaseCommand {
    constructor(db) {
        super(
            new SlashCommandBuilder()
                .setName('createclass')
                .setDescription('Cria uma nova turma')
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Nome da turma')
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('faq-channel')
                        .setDescription('Canal de faq da nova turma (obrigatório para novas turmas)')
                        .setRequired(true)
                )
        )
        this.db = db
    }

    // Sobrescreve o execute do BaseCommand
    async execute(interaction) {
        // Responde de forma atrasada para evitar timeout
        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        // Nome/Sigla da nova turma
        const className = interaction.options.getString('name');

        // Função que cria um convite e registra no banco de dados
        const createInvite = async (targetRole, targetChannel) => {
            if (!targetChannel) throw new Error("Canal do invite não encontrado");
            // Cria o convite
            const invite = await targetChannel.createInvite({
                maxAge: 0, // Convite permanente
                maxUses: 0, // Convite ilimitado
                unique: true
            });

            // Insere o convite no banco de dados
            await this.db.saveInvite(invite.code, targetRole.id, interaction.guild.id);

            return invite.url;
        }

        try {
            const classRole = await interaction.guild.roles.create({
                name: `Estudantes ${className}`,
                color: 3447003,
                mentionable: true, // Permite que o cargo seja mencionado
                hoist: true, // Exibe o cargo na lista de membros
                permissions: classRolePermissions
            });

            // Pega todos os canais do servidor
            const serverChannels = await interaction.guild.channels.cache

            // Atribui as permissões do novo cargo aos canais
            for (const channel of serverChannels.values()) {
                // Ignora canais não especificados no arquivo de configuração "classPatterns"
                if ([...somePermissionsChannels, interaction.options.getChannel('faq-channel').name].includes(channel.name)) {
                    await channel.permissionOverwrites.edit(classRole, {
                        SendMessages: false,
                        ViewChannel: true,
                        ReadMessageHistory: true,
                        AddReactions: true
                    });
                } else if (allPermissionsChannels.includes(channel.name)) {
                    await channel.permissionOverwrites.edit(classRole, {
                        SendMessages: true,
                        ViewChannel: true,
                        ReadMessageHistory: true,
                        AddReactions: true
                    });
                }
            }

            // Pega os cargos do servidor
            const roles = await interaction.guild.roles.cache;

            // Pega os canais do servidor e filtra o nome
            let inviteChannel = await interaction.guild.channels.cache;
            inviteChannel = inviteChannel.find(channel => channel.name === "✨│boas-vindas")

            // Muda o nome "className" para o nome da turma
            const new_RolesForNewClasses = defaultRoles.rolesForNewClasses.map(obj => {
                const role = obj.name === "className"
                    ? roles.find(r => r.name === `Estudantes ${className}`)
                    : roles.find(r => r.name === obj.name);

                return {
                    id: role.id,
                    allow: obj.allow,
                    deny: obj.deny //.map(p => PermissionFlagsBits[p.toUpperCase()]) // convertendo permissões
                };
            });

            // Cria a categoria da turma
            const classCategory = await interaction.guild.channels.create({
                name: className,
                type: 4, // Categoria
                permissionOverwrites: new_RolesForNewClasses,
            });

            // Cria os canais da turma
            for (const channel of classChannels) {
                // Cria e define um alvo para preencher as permissões
                const target = await interaction.guild.channels.create({
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parent: classCategory.id // Define a categoria da turma
                })

                // Verificação para o canal de dúvidas para fazer as ativações
                if (channel.name === "❓│dúvidas") {
                    await target.setAvailableTags(defaultTags);
                    await Promise.all(classActivations.map(async (activate) => {
                        const content = activate.content.includes("{mention}")
                            ? activate.content.replace("{mention}", `${classRole}`)
                            : activate.content;

                        await target.threads.create({
                            name: activate.title,
                            message: { content }
                        });
                    }));

                } else if ([classChannels[1].name, classChannels[4].name].includes(channel.name)) {
                    // Define quais canais os membros não podem enviar mensagens
                    await target.permissionOverwrites.edit(classRole, {
                        SendMessages: false,
                        ViewChannel: true
                    })
                } else if ([classChannels[6].name, classChannels[7].name].includes(channel.name)) {
                    // Define os canais que devem conter o nome/sigla da turma
                    await target.edit({name: channel.name+className})
                }
            }

            // Cria o convite
            let inviteUrl;
            try {
                inviteUrl = await createInvite(classRole, inviteChannel);
            } catch (error) {
                console.error("ERRO - Não foi possível criar o convite\n", error);
                inviteUrl = "Erro no momento de criação do invite";
            }


            // Responde com o link do invite e outras informações
            await interaction.editReply({
                content: `✅ Turma ${className} criado com sucesso!\n👥 Cargo vinculado: ${classRole}\nLink do convite: ${inviteUrl}\n`, // `✅ Turma ${className} criado com sucesso!\n📨 Link do convite: ${inviteUrl}\n👥 Cargo vinculado: ${classRole}`
                flags: MessageFlags.Ephemeral
            })

        } catch (error) {
            console.error(`ERRO - Não foi possivel criar a turma\n${error}`);
            await interaction.editReply({
                content: `❌ Erro ao criar ${className}\n` + "```" + error + "```",
                flags: MessageFlags.Ephemeral
            });
        }
    }
}