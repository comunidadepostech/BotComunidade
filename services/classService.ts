import {
    CategoryChannel,
    ChannelType,
    GuildMember,
    PermissionFlagsBits,
    Role,
    Collection,
    ChatInputCommandInteraction, GuildBasedChannel, Channel, TextChannel, Invite, ThreadAutoArchiveDuration
} from "discord.js"
import { ChannelConfig, ClassCreateResult } from "../entities/discordEntities.ts"

export default class ClassService {
    private static readonly ADMIN_ROLES = [
        'Equipe Pós-Tech',
        'Talent Lab',
        'Gestor acadêmico',
        'Coordenação',
        'Professores',
    ];

    private static readonly ADMIN_PERMISSIONS = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.CreatePublicThreads,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.MentionEveryone,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendPolls,
        PermissionFlagsBits.UseVAD,
    ];

    private static readonly STUDENT_PERMISSIONS = [
        PermissionFlagsBits.ChangeNickname,
        PermissionFlagsBits.SendMessagesInThreads,
        PermissionFlagsBits.CreatePublicThreads,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.UseExternalEmojis,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.UseVAD,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.RequestToSpeak,
        PermissionFlagsBits.UseExternalStickers,
    ];

    private static readonly CHANNELS_CONFIG: ChannelConfig[] = [
        { name: '🙋│apresente-se', type: ChannelType.GuildText, position: 0 },
        { name: '🚨│avisos', type: ChannelType.GuildText, position: 1, restrictStudents: true },
        { name: '💬│bate-papo', type: ChannelType.GuildText, position: 2 },
        { name: '‍💻│grupos-tech-challenge', type: ChannelType.GuildText, position: 3 },
        { name: '‍🎥│gravações', type: ChannelType.GuildText, position: 4, restrictStudents: true },
        { name: '❓│dúvidas', type: ChannelType.GuildForum, position: 5 },
        { name: '🎙️│Dinâmica ao vivo', type: ChannelType.GuildStageVoice, position: 6 },
        { name: '📒│Sala de estudo', type: ChannelType.GuildVoice, position: 7 },
    ];

    private static readonly FORUM_TAGS = [
        'Geral',
        'Tech Challenge',
        'Fase 1',
        'Fase 2',
        'Fase 3',
        'Fase 4',
        'Fase 5',
        'Alura',
        'Beneficios',
        'Financeiro',
        'Atividade presencial',
        'Lives',
        'Notas',
        'Eventos',
    ];

    private static readonly INITIAL_POSTS = [
        {
            title: 'Integração Calendário',
            content:
                '# 📢 Integração Calendário + Discord\n\nVocê sabia que é possível **integrar os eventos do Discord ao seu calendário do Outlook**?\n\nPreparamos um **guia simples e objetivo** para te ajudar a manter seus compromissos do servidor organizados direto no seu e-mail.\n\n🔗 https://youtu.be/QqyxxZwzsR8 e sincronize seus eventos com praticidade.\n\n{mention}',
        },
        {
            title: 'Composição da Nota',
            content:
                'Olá, turma! {mention}\n\nViemos informar sobre a composição das notas para os cursos da Postech. A avaliação é composta pelos seguintes elementos:\n\nCAPÍTULO III – DOS CRITÉRIOS DE AVALIAÇÃO E DE APROVAÇÃO\n\n**Artigo 10º** - O desempenho do(a) estudante para avaliação e aprovação dar-se-á por meio de avaliação on-line e avaliação presencial.\n\n**§ 1º** - A pontuação compor-se-á do seguinte critério:\nI. Das atividades on-line em cada fase com valor de 0 a 90 pontos- Tech Challenge – Fases 1 a 4\nII. Hackathon – Fase 5 (o formato pode variar dependendo do curso: Datathon, Capture the Flag, Hackathon, etc.) - 0 a 90 pontos\nIII. Da avaliação presencial individual e obrigatória a ser agendada em qualquer um dos polos FIAP com valor de 0 a 10 pontos.\n\n**§ 2º** - O cálculo da Nota Final (NF) levará em consideração o somatório dos dois processos avaliativos:\n\nAtividades on-line (90) + Atividade presencial (10) = 100 pontos.\n\nObs: todas as informações sobre as notas serão apresentadas para a turma na Aula Inaugural.\n\nEquipe Comunidade Postech!',
        },
        {
            title: 'Carteirinha de Estudante',
            content:
                'Fala turma! {mention}\n\nGostaria de avisar que vocês tem acesso a carteirinha de estudante através do app "FIAP".\n\nLá no App você segue os passos indicados e pode gerar a sua carteirinha digital.\n\nSegue os links para download:\nApp Store: [‎FIAP ON](https://apps.apple.com/br/app/fiap-on/id1270235539)\nPlay Store: [fiap on - Android Apps on Google Play](https://play.google.com/store/search?q=fiap+on&c=apps)\n\nCaso tenham alguma dificuldade, podem entrar em contato com o nosso atendimento pelo email: [atendimento.postech@fiap.com.br](mailto:atendimento.postech@fiap.com.br) ou Whatsapp (11)98170-0028',
        },
        {
            title: 'Ferramentas Disponíveis para Acesso',
            content:
                'Estamos começando com tudo, e vocês têm à disposição várias ferramentas tecnológicas incríveis que vão dar aquele boost nos estudos. 🚀\n\n🔧 Visual Studio Code\n\n🐙 GitHub\n\n🤖 GitHub Copilot\n\n🔨 Rider\n\n🐙 GitKraken\n\n☁️ Azure\n\n💻 JetBrains\n\n🎨 Figma\n\n🛠️ DataGrip\n\n🔧 MS Visual Studio for Students\n\n🎓 Benefícios Microsoft: Acesse várias ferramentas e recursos exclusivos para estudantes, como o [Microsoft 365 Web](https://www.microsoft.com/pt-br/education/products/office), o [Azure for Students](https://azure.microsoft.com/pt-br/pricing/purchase-options/azure-account/search) e o [Visual Studio](https://www.linkedin.com/pulse/visual-studio-dev-essentials-free-thiago-adriano/)\n\nPara acessar esses benefícios, você precisa adicionar o seu email da FIAP.\nQualquer dúvida, estamos por aqui para ajudar. 😉\n\n{mention}',
        },
        {
            title: 'Boas Práticas para a Comunidade',
            content:
                'Faaala turma {mention}! Tudo bem?\n\nComo uma boa prática do servidor, solicitamos que todos os estudantes insiram no nome de usuário do Discord, o seu RM.\n\nPara realizar esta troca, basta clicar na sua foto de perfil e após no ícone de lápis (no canto superior direito do banner que aparecerá).\n\nPor lá, vai aparecer o campo de "Nome exibido" e você poderá adicionar o seu RM. No meu caso ficaria: Eduardo Bortoli - RM123456.\nCaso você queira mudar o nome apenas no servidor da turma: Após clicar no lápis, você pode ir na opção "perfis do servidor" e alterar apenas o "apelido do servidor" Depois de mudar o seu nome/apelido, basta salvar a alteração e já está tudo certo.\n\nDesta maneira, toda vez que um aluno ou aluna precisar de auxílio, conseguiremos buscar direto na plataforma os seus dados e resolver de maneira muito mais ágil todos os seus chamados.\n\nContamos com a ajuda de vocês e seguimos por aqui! Abraços!',
        },
        {
            title: 'Como acessar meu certificado da Fase?',
            content:
                'Se você finalizou e enviou o Tech Challenge, o seu certificado da fase já está disponível na plataforma!\n\nNosso time preparou um vídeo para explicar o passo a passo, caso você ainda tenha dúvidas sobre como realizar o download e compartilhar seu certificado de fase nas redes.\n\nLink: https://youtu.be/k1fVMSg5OmU',
        },
        {
            title: 'E-mail Estudantil @fiap',
            content:
                'Olá, {mention}!! Temos uma informação importante para vocês sobre a caixa de e-mail @fiap:\n\n- Referente as caixas de e-mail dos estudantes, o acesso é apenas para o benefício do pacote office e solicitação de algumas ferramentas (planos para estudantes);\n\n- A CAIXA NÃO ESTÁ HABILITADA PARA ENVIAR E-MAILS!\n\n- O envio de comunicações em geral, é feito apenas através do **e-mail cadastrado pelo aluno ou aluna no ato da matrícula.**\n\n**O acesso ao pacote office web deve ser feito da seguinte forma:**\n\n**Link:** [Free Office 365 web for Students and Educators | Microsoft Education](https://office.com/getoffice365)\n**E-MAIL:** rm......@fiap.com.br (No lugar dos pontinhos será o número do seu rm)\n**Senha:** DtNasc#...... (No lugar dos pontinhos sua data de nascimento no formato curto o ano, ex: 010698) No caso ficaria: DtNasc#010698 (As letras "D" e "N" são maiúsculas e fazem parte da senha) Seguindo o exemplo acima, para acessar utilizaríamos:\n\n**Login:** rm123456@fiap.com.br\n**Senha:** DtNasc#010698\nNo site do Office > Selecionar Instalar Aplicativos Office. Todos os alunos e alunas matriculadas, já possuem esse acesso liberado.\n\n**Qualquer problema deve ser direcionado ao nosso TI, pelos canais:** Helpdesk@fiap.com.br ou pelo WhatsApp (11) 98170 0028 (selecionar opção 2 para suporte técnico).\n\nP.S.: Se você não conseguiu acessar a caixa de e-mail por conta de algum erro, ou está com dúvidas, entre em contato com o time de HelpDesk para receber o suporte adequado. Eles terão os acessos necessários para corrigir eventuais falhas.',
        },
    ];

    async create(
        interaction: ChatInputCommandInteraction,
        className: string,
        faqChannelId: string,
    ): Promise<ClassCreateResult> {
        try {
            const guild = interaction.guild!;

            // 1. Criar/atualizar roles admin
            await this.ensureAdminRoles(guild);

            // 2. Criar cargo da turma
            const classRole = await this.createClassRole(guild, className);

            // 3. Dar permissões em canais padrão
            const channels = guild.channels.cache;
            await this.givePermissionsForDefaultChannels(classRole, channels, faqChannelId);

            // 4. Criar categoria da turma
            const adminRoles = guild.roles.cache.filter((role) =>
                ClassService.ADMIN_ROLES.includes(role.name),
            );
            const classCategory = await this.createCategory(guild, className, adminRoles, classRole);

            // 5. Criar canais da turma
            await this.createChannels(guild, className, classCategory, classRole);

            // 6. Adicionar posts e tags no forum
            await this.setupForumChannel(channels, classCategory, classRole);

            // 7. Criar convite
            const inviteChannel = channels.find((ch) => ch.name === '✨│boas-vindas') as TextChannel;
            const invite = await this.createInvite(inviteChannel);

            return {
                success: true,
                className,
                role: classRole,
                category: classCategory,
                inviteUrl: invite.url,
                message: `✅ Turma ${className} criado com sucesso!\n👥 Cargo vinculado: ${classRole}\nLink do convite: ${invite.url}`,
            };
        } catch (error) {
            throw new Error(`Erro ao criar turma ${className}: ${error}`);
        }
    }

    private async ensureAdminRoles(guild: any): Promise<void> {
        const existingRoles = new Set(guild.roles.cache.map((r: Role) => r.name));

        const rolesToCreate = ClassService.ADMIN_ROLES.filter((name) => !existingRoles.has(name));

        await Promise.all(rolesToCreate.map((name) => guild.roles.create({ name })));
    }

    private async createClassRole(guild: any, className: string): Promise<Role> {
        return await guild.roles.create({
            name: `Estudantes ${className}`,
            color: 3447003,
            mentionable: true,
            hoist: true,
            permissions: ClassService.STUDENT_PERMISSIONS,
        });
    }

    private async createCategory(
        guild: any,
        className: string,
        adminRoles: Collection<string, Role>,
        classRole: Role,
    ): Promise<CategoryChannel> {
        const permissionOverwrites = [
            // Permissões para roles admin
            ...ClassService.ADMIN_ROLES.map((roleName) => ({
                id: adminRoles.find((r) => r.name === roleName)!.id,
                allow: ClassService.ADMIN_PERMISSIONS,
                deny: [],
            })),
            // Permissões para role de estudante
            {
                id: classRole.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendPolls],
            },
        ];

        return await guild.channels.create({
            name: className,
            type: ChannelType.GuildCategory,
            permissionOverwrites,
        });
    }

    private async createChannels(
        guild: any,
        className: string,
        category: CategoryChannel,
        classRole: Role,
    ): Promise<void> {
        const promises = ClassService.CHANNELS_CONFIG.map((config) => {
            const isVoiceChannel =
                config.type === ChannelType.GuildVoice || config.type === ChannelType.GuildStageVoice;
            const channelName = isVoiceChannel ? `${config.name.replace(/^[📒🎙️]│/, '')} ${className}` : config.name;

            const channelData: any = {
                name: channelName,
                type: config.type,
                parent: category,
                position: config.position,
            };

            if (!isVoiceChannel) {
                channelData.defaultAutoArchiveDuration = ThreadAutoArchiveDuration.OneWeek;
            }

            if (config.restrictStudents) {
                channelData.permissionOverwrites = [
                    {
                        id: classRole.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages],
                    },
                ];
            }

            return guild.channels.create(channelData).then((channel: any) => channel.lockPermissions());
        });

        await Promise.all(promises);
    }

    private async setupForumChannel(
        channels: Collection<string, GuildBasedChannel>,
        category: CategoryChannel,
        classRole: Role,
    ): Promise<void> {
        const forumChannel = channels.find(
            (ch) =>
                ch.name === '❓│dúvidas' &&
                ch.parent?.id === category.id &&
                ch.type === ChannelType.GuildForum,
        ) as any;

        if (!forumChannel) return;

        // Configurar tags
        await forumChannel.setAvailableTags(ClassService.FORUM_TAGS.map((name) => ({ name, moderated: false })));

        // Criar posts iniciais
        await Promise.all(
            ClassService.INITIAL_POSTS.map((post) =>
                forumChannel.threads.create({
                    name: post.title,
                    message: { content: post.content.replaceAll('{mention}', `${classRole}`) },
                }),
            ),
        );
    }

    private async givePermissionsForDefaultChannels(
        classRole: Role,
        channels: Collection<string, Channel>,
        faqChannelId: string,
    ): Promise<void> {
        const permissionMap = {
            Alun: { ReadMessageHistory: true, SendMessages: true, ViewChannel: true, CreatePublicThreads: true },
            'Pós Tech': {
                ReadMessageHistory: true,
                SendMessages: false,
                ViewChannel: true,
                CreatePublicThreads: false,
            },
        };

        for (const channel of channels.values()) {
            if (channel.type === ChannelType.GuildCategory) {
                const permissions = permissionMap[channel.name as keyof typeof permissionMap];
                if (permissions) {
                    await channel.permissionOverwrites.edit(classRole, permissions);
                }
            } else if (channel.id === faqChannelId && channel.type === ChannelType.GuildText) {
                await (channel as TextChannel).permissionOverwrites.edit(classRole, {
                    ReadMessageHistory: true,
                    SendMessages: false,
                    ViewChannel: true,
                    CreatePublicThreads: true,
                });
            }
        }
    }

    private async createInvite(channel: TextChannel): Promise<Invite> {
        return await channel.createInvite({
            maxAge: 0,
            maxUses: 0,
            unique: true,
        });
    }

    public static async disable(members: GuildMember[], role: Role) {
        for (const member of members) {
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);
            }
        }
    }
}