var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CreateClassCommand_instances, _CreateClassCommand_createCategory, _CreateClassCommand_createChannels, _CreateClassCommand_createRole, _CreateClassCommand_editChannels, _CreateClassCommand_givePermissionsForDefaultChannels, _CreateClassCommand_createInvite;
import { BaseCommand } from './baseCommand.js';
import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, ThreadAutoArchiveDuration } from 'discord.js';
// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
export class CreateClassCommand extends BaseCommand {
    constructor(bot) {
        super(new SlashCommandBuilder()
            .setName(import.meta.url.split('/').pop().replace('.js', ''))
            .setDescription('Cria uma nova turma')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(option => option.setName('name')
            .setDescription('Nome da turma')
            .setRequired(true))
            .addChannelOption(option => option.setName('faq-channel')
            .setDescription('Canal de faq da nova turma (obrigatório para novas turmas)')
            .setRequired(true)));
        _CreateClassCommand_instances.add(this);
        this.bot = bot;
    }
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const className = interaction.options.getString('name');
            const faqChannel = interaction.options.getChannel("faq-channel");
            // Pega todos os canais e cargos do servidor
            const channels = yield interaction.guild.channels.cache;
            const roles = yield interaction.guild.roles.cache;
            // Cria o cargo da turma
            const classRole = yield __classPrivateFieldGet(this, _CreateClassCommand_instances, "m", _CreateClassCommand_createRole).call(this, interaction, className);
            yield __classPrivateFieldGet(this, _CreateClassCommand_instances, "m", _CreateClassCommand_givePermissionsForDefaultChannels).call(this, classRole, channels, faqChannel);
            // Cria a categoria da turma
            const classCategory = yield __classPrivateFieldGet(this, _CreateClassCommand_instances, "m", _CreateClassCommand_createCategory).call(this, interaction, className, roles);
            // Cria os canais da turma
            yield __classPrivateFieldGet(this, _CreateClassCommand_instances, "m", _CreateClassCommand_createChannels).call(this, interaction, className, classCategory);
            // Ajeita o nome de canais e as permissões
            yield __classPrivateFieldGet(this, _CreateClassCommand_instances, "m", _CreateClassCommand_editChannels).call(this, channels, classRole, classCategory);
            // Pega os canais do servidor e filtra o nome para achar o de boas vindas
            let inviteChannel = channels.find(channel => channel.name === "✨│boas-vindas");
            // Cria o convite
            const invite = yield __classPrivateFieldGet(this, _CreateClassCommand_instances, "m", _CreateClassCommand_createInvite).call(this, inviteChannel);
            // Responde com o link do invite e outras informações
            yield interaction.editReply({
                content: `✅ Turma ${className} criado com sucesso!\n👥 Cargo vinculado: ${classRole}\nLink do convite: ${invite.url}\n`, // `✅ Turma ${className} criado com sucesso!\n📨 Link do convite: ${inviteUrl}\n👥 Cargo vinculado: ${classRole}`
                flags: MessageFlags.Ephemeral
            });
        });
    }
}
_CreateClassCommand_instances = new WeakSet(), _CreateClassCommand_createCategory = function _CreateClassCommand_createCategory(interaction, className, guildRoles) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield interaction.guild.channels.create({
            name: className,
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guildRoles.find(role => role.name === "Equipe Pós-Tech").id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.MentionEveryone,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.SendPolls,
                        PermissionFlagsBits.UseVAD
                    ],
                    deny: []
                },
                {
                    id: guildRoles.find(role => role.name === "Talent Lab").id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.MentionEveryone,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.SendPolls,
                        PermissionFlagsBits.UseVAD
                    ],
                    deny: []
                },
                {
                    id: guildRoles.find(role => role.name === "Gestor acadêmico").id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.MentionEveryone,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.SendPolls,
                        PermissionFlagsBits.UseVAD
                    ],
                    deny: []
                },
                {
                    id: guildRoles.find(role => role.name === "Coordenação").id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.MentionEveryone,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.SendPolls,
                        PermissionFlagsBits.UseVAD
                    ],
                    deny: []
                },
                {
                    id: guildRoles.find(role => role.name === "Professores").id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.EmbedLinks,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.MentionEveryone,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.SendPolls,
                        PermissionFlagsBits.UseVAD
                    ],
                    deny: []
                },
                {
                    id: guildRoles.find(role => role.name === `Estudantes ${className}`).id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendPolls]
                }
            ]
        });
    });
}, _CreateClassCommand_createChannels = function _CreateClassCommand_createChannels(interaction, className, parent) {
    return __awaiter(this, void 0, void 0, function* () {
        let promises = [
            interaction.guild.channels.create({
                name: "🙋│apresente-se",
                type: ChannelType.GuildText,
                parent: parent,
                position: 0,
                defaultAutoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
                lockPermissions: true
            }),
            interaction.guild.channels.create({
                name: "🚨│avisos",
                type: ChannelType.GuildText,
                parent: parent,
                position: 1,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.cache.find(role => role.name === "Estudantes " + className).id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    }
                ],
                lockPermissions: false
            }),
            interaction.guild.channels.create({
                name: "💬│bate-papo",
                type: ChannelType.GuildText,
                parent: parent,
                position: 2,
                lockPermissions: true
            }),
            interaction.guild.channels.create({
                name: "‍💻│grupos-tech-challenge",
                type: ChannelType.GuildText,
                parent: parent,
                position: 3,
                lockPermissions: true
            }),
            interaction.guild.channels.create({
                name: "‍🎥│gravações",
                type: ChannelType.GuildText,
                parent: parent,
                position: 4,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.cache.find(role => role.name === "Estudantes " + className).id,
                        allow: [PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.SendMessages]
                    }
                ],
                lockPermissions: false
            }),
            interaction.guild.channels.create({
                name: "❓│dúvidas",
                type: ChannelType.GuildForum,
                parent: parent,
                position: 5,
                lockPermissions: true
            }),
            interaction.guild.channels.create({
                name: `🎙️│Dinâmica ao vivo ${className}`,
                type: ChannelType.GuildStageVoice,
                parent: parent,
                position: 6,
                lockPermissions: true
            }),
            interaction.guild.channels.create({
                name: `📒│Sala de estudo ${className}`,
                type: ChannelType.GuildVoice,
                parent: parent,
                position: 7,
                lockPermissions: true
            })
        ];
        yield Promise.all(promises);
    });
}, _CreateClassCommand_createRole = function _CreateClassCommand_createRole(interaction, className) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield interaction.guild.roles.create({
            name: `Estudantes ${className}`,
            color: 3447003,
            mentionable: true, // Permite que o cargo seja mencionado
            hoist: true, // Exibe o cargo na lista de membros
            permissions: [
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
                PermissionFlagsBits.UseExternalStickers
            ]
        });
    });
}, _CreateClassCommand_editChannels = function _CreateClassCommand_editChannels(guildChannels, classRole, classCategory) {
    return __awaiter(this, void 0, void 0, function* () {
        const posts = [
            {
                title: "Integração Calendário",
                content: "# 📢 Integração Calendário + Discord\n" +
                    "\n" +
                    "Você sabia que é possível **integrar os eventos do Discord ao seu calendário do Outlook**?\n" +
                    "\n" +
                    "Preparamos um **guia simples e objetivo** para te ajudar a manter seus compromissos do servidor organizados direto no seu e-mail.\n" +
                    "\n" +
                    "🔗 https://youtu.be/QqyxxZwzsR8 e sincronize seus eventos com praticidade.\n" +
                    "\n" +
                    "{mention}"
            },
            {
                title: "Composição da Nota",
                content: "Olá, turma! {mention}\n" +
                    "\n" +
                    "Viemos informar sobre a composição das notas para os cursos da Postech. A avaliação é composta pelos seguintes elementos:\n" +
                    "\n" +
                    "CAPÍTULO III – DOS CRITÉRIOS DE AVALIAÇÃO E DE APROVAÇÃO\n" +
                    "\n" +
                    "**Artigo 10º** - O desempenho do(a) estudante para avaliação e aprovação dar-se-á por meio de avaliação on-line e avaliação presencial.\n" +
                    "\n" +
                    "**§ 1º** - A pontuação compor-se-á do seguinte critério:\n" +
                    "I. Das atividades on-line em cada fase com valor de 0 a 90 pontos- Tech Challenge – Fases 1 a 4\n" +
                    "II. Hackathon – Fase 5 (o formato pode variar dependendo do curso: Datathon, Capture the Flag, Hackathon, etc.) - 0 a 90 pontos\n" +
                    "III. Da avaliação presencial individual e obrigatória a ser agendada em qualquer um dos polos FIAP com valor de 0 a 10 pontos.\n" +
                    "\n" +
                    "**§ 2º** - O cálculo da Nota Final (NF) levará em consideração o somatório dos dois processos avaliativos:\n" +
                    "\n" +
                    "Atividades on-line (90) + Atividade presencial (10) = 100 pontos.\n" +
                    "\n" +
                    "Obs: todas as informações sobre as notas serão apresentadas para a turma na Aula Inaugural.\n" +
                    "\n" +
                    "Equipe Comunidade Postech!"
            },
            {
                title: "Carteirinha de Estudante",
                content: "Fala turma! {mention}\n" +
                    "\n" +
                    "Gostaria de avisar que vocês tem acesso a carteirinha de estudante através do app \"FIAP\".\n" +
                    "\n" +
                    "Lá no App você segue os passos indicados e pode gerar a sua carteirinha digital.\n" +
                    "\n" +
                    "Segue os links para download:\n" +
                    "App Store: [‎FIAP ON](https://apps.apple.com/br/app/fiap-on/id1270235539)\n" +
                    "Play Store: [fiap on - Android Apps on Google Play](https://play.google.com/store/search?q=fiap+on&c=apps)\n" +
                    "\n" +
                    "Caso tenham alguma dificuldade, podem entrar em contato com o nosso atendimento pelo email: [atendimento.postech@fiap.com.br](mailto:atendimento.postech@fiap.com.br) ou Whatsapp (11)98170-0028"
            },
            {
                title: "Ferramentas Disponíveis para Acesso",
                content: "Estamos começando com tudo, e vocês têm à disposição várias ferramentas tecnológicas incríveis que vão dar aquele boost nos estudos. 🚀\n" +
                    "\n" +
                    "🔧 Visual Studio Code\n" +
                    "\n" +
                    "🐙 GitHub\n" +
                    "\n" +
                    "🤖 GitHub Copilot\n" +
                    "\n" +
                    "🔨 Rider\n" +
                    "\n" +
                    "🐙 GitKraken\n" +
                    "\n" +
                    "☁️ Azure\n" +
                    "\n" +
                    "💻 JetBrains\n" +
                    "\n" +
                    "🎨 Figma\n" +
                    "\n" +
                    "🛠️ DataGrip\n" +
                    "\n" +
                    "🔧 MS Visual Studio for Students\n" +
                    "\n" +
                    "🎓 Benefícios Microsoft: Acesse várias ferramentas e recursos exclusivos para estudantes, como o [Microsoft 365 Web](https://www.microsoft.com/pt-br/education/products/office), o [Azure for Students](https://azure.microsoft.com/pt-br/pricing/purchase-options/azure-account/search) e o [Visual Studio](https://www.linkedin.com/pulse/visual-studio-dev-essentials-free-thiago-adriano/)\n" +
                    "\n" +
                    "Para acessar esses benefícios, você precisa adicionar o seu email da FIAP.\n" +
                    "Qualquer dúvida, estamos por aqui para ajudar. 😉\n" +
                    "\n" +
                    "{mention}"
            },
            {
                title: "Boas Práticas para a Comunidade",
                content: "Faaala turma {mention}! Tudo bem?\n" +
                    "\n" +
                    "Como uma boa prática do servidor, solicitamos que todos os estudantes insiram no nome de usuário do Discord, o seu RM.\n" +
                    "\n" +
                    "Para realizar esta troca, basta clicar na sua foto de perfil e após no ícone de lápis (no canto superior direito do banner que aparecerá).\n" +
                    "\n" +
                    "Por lá, vai aparecer o campo de \"Nome exibido\" e você poderá adicionar o seu RM. No meu caso ficaria: Eduardo Bortoli - RM123456.\n" +
                    "Caso você queira mudar o nome apenas no servidor da turma: Após clicar no lápis, você pode ir na opção \"perfis do servidor\" e alterar apenas o \"apelido do servidor\" Depois de mudar o seu nome/apelido, basta salvar a alteração e já está tudo certo.\n" +
                    "\n" +
                    "Desta maneira, toda vez que um aluno ou aluna precisar de auxílio, conseguiremos buscar direto na plataforma os seus dados e resolver de maneira muito mais ágil todos os seus chamados. \n" +
                    "\n" +
                    "Contamos com a ajuda de vocês e seguimos por aqui! Abraços!"
            },
            {
                title: "Como acessar meu certificado da Fase?",
                content: "Se você finalizou e enviou o Tech Challenge, o seu certificado da fase já está disponível na plataforma!\n" +
                    "\n" +
                    "Nosso time preparou um vídeo para explicar o passo a passo, caso você ainda tenha dúvidas sobre como realizar o download e compartilhar seu certificado de fase nas redes.\n" +
                    "\n" +
                    "Link: https://youtu.be/k1fVMSg5OmU"
            },
            {
                title: "E-mail Estudantil @fiap",
                content: "Olá, {mention}!! Temos uma informação importante para vocês sobre a caixa de e-mail @‌fiap:\n" +
                    "\n" +
                    "- Referente as caixas de e-mail dos estudantes, o acesso é apenas para o benefício do pacote office e solicitação de algumas ferramentas (planos para estudantes);\n" +
                    "\n" +
                    "- A CAIXA NÃO ESTÁ HABILITADA PARA ENVIAR E-MAILS!\n" +
                    "\n" +
                    "- O envio de comunicações em geral, é feito apenas através do **e-mail cadastrado pelo aluno ou aluna no ato da matrícula.**\n" +
                    "\n" +
                    "**O acesso ao pacote office web deve ser feito da seguinte forma:**\n" +
                    "\n" +
                    "**Link:** [Free Office 365 web for Students and Educators | Microsoft Education](http://office.com/getoffice365)\n" +
                    "**E-MAIL:** rm......@fiap.com.br (No lugar dos pontinhos será o número do seu rm)\n" +
                    "**Senha:** DtNasc#...... (No lugar dos pontinhos sua data de nascimento no formato curto o ano, ex: 010698) No caso ficaria: DtNasc#010698 (As letras \"D\" e \"N\" são maiúsculas e fazem parte da senha) Seguindo o exemplo acima, para acessar utilizaríamos:\n" +
                    "\n" +
                    "**Login:** rm123456@fiap.com.br\n" +
                    "**Senha:** DtNasc#010698\n" +
                    "No site do Office > Selecionar Instalar Aplicativos Office. Todos os alunos e alunas matriculadas, já possuem esse acesso liberado.\n" +
                    "\n" +
                    "**Qualquer problema deve ser direcionado ao nosso TI, pelos canais:** Helpdesk@fiap.com.br ou pelo WhatsApp (11) 98170 0028 (selecionar opção 2 para suporte técnico).\n" +
                    "\n" +
                    "P.S.: Se você não conseguiu acessar a caixa de e-mail por conta de algum erro, ou está com dúvidas, entre em contato com o time de HelpDesk para receber o suporte adequado. Eles terão os acessos necessários para corrigir eventuais falhas.\n"
            }
        ];
        for (const channel of guildChannels.values()) {
            if (channel.name === "❓│dúvidas" && channel.parent.id === classCategory.id) {
                yield channel.setAvailableTags([
                    { name: "Geral", moderated: false },
                    { name: "Tech Challenge", moderated: false },
                    { name: "Fase 1", moderated: false },
                    { name: "Fase 2", moderated: false },
                    { name: "Fase 3", moderated: false },
                    { name: "Fase 4", moderated: false },
                    { name: "Fase 5", moderated: false },
                    { name: "Alura", moderated: false },
                    { name: "Beneficios", moderated: false },
                    { name: "Financeiro", moderated: false },
                    { name: "Atividade presencial", moderated: false },
                    { name: "Lives", moderated: false },
                    { name: "Notas", moderated: false },
                    { name: "Eventos", moderated: false }
                ]);
                yield Promise.all(posts.map((post) => __awaiter(this, void 0, void 0, function* () {
                    yield channel.threads.create({
                        name: post.title,
                        message: { content: post.content.replaceAll("{mention}", `${classRole}`) }
                    });
                })));
            }
        }
    });
}, _CreateClassCommand_givePermissionsForDefaultChannels = function _CreateClassCommand_givePermissionsForDefaultChannels(classRole, channels, faqChannel) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const channel of channels.values()) {
            // This condition is for a general channel. Please verify the name "Alun" is correct.
            if (channel.name === "Alun") {
                yield channel.permissionOverwrites.edit(classRole, {
                    [PermissionFlagsBits.ReadMessageHistory]: true,
                    [PermissionFlagsBits.SendMessages]: true,
                    [PermissionFlagsBits.ViewChannel]: true,
                    [PermissionFlagsBits.CreatePublicThreads]: true
                });
            }
            // This condition is for the specific FAQ channel.
            // We check by ID to be precise and avoid changing permissions on the "Pós Tech" category by mistake.
            else if (channel.id === faqChannel.id) {
                yield channel.permissionOverwrites.edit(classRole, {
                    [PermissionFlagsBits.ReadMessageHistory]: true,
                    [PermissionFlagsBits.SendMessages]: false,
                    [PermissionFlagsBits.ViewChannel]: true,
                    [PermissionFlagsBits.CreatePublicThreads]: true
                });
            }
        }
    });
}, _CreateClassCommand_createInvite = function _CreateClassCommand_createInvite(inviteChannel) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield inviteChannel.createInvite({
            maxAge: 0, // Convite permanente
            maxUses: 0, // Convite ilimitado
            unique: true
        });
    });
};
