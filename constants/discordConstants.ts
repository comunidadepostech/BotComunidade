import { ChannelType, PermissionFlagsBits } from 'discord.js';
import type { IChannelConfig } from '../types/discord.interfaces.ts';

export const WELCOME_CHANNEL_NAME = '✨│boas-vindas';
export const WARNING_CHANNEL_NAME = '🚨│avisos';
export const STUDY_GROUP_CHANNEL_NAME = '📒│Sala de estudo';
export const STUDY_GROUP_POSSIBLE_NAMES = [
  'Sala de estudo',
  'Sala de estudos',
  'Grupo de estudo',
  'Grupo de estudos',
  'Grupo de Estudos',
  'Grupo de Estudo',
  'Sala de Estudos',
];
export const ROLE_NAME_REPLACEMENT = '{cargo}';

export const ADMIN_PERMISSIONS = [
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

export const FORUM_TAGS = [
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

export const CHANNELS_CONFIG: IChannelConfig[] = [
  { name: '🙋│apresente-se', type: ChannelType.GuildText, position: 0 },
  { name: '🚨│avisos', type: ChannelType.GuildText, position: 1, restrictStudents: true },
  { name: '💬│bate-papo', type: ChannelType.GuildText, position: 2 },
  { name: '‍💻│grupos-tech-challenge', type: ChannelType.GuildText, position: 3 },
  { name: '‍🎥│gravações', type: ChannelType.GuildText, position: 4, restrictStudents: true },
  { name: '❓│dúvidas', type: ChannelType.GuildForum, position: 5 },
  { name: '🎙️│Dinâmica ao vivo', type: ChannelType.GuildStageVoice, position: 6 },
  { name: '📒│Sala de estudo', type: ChannelType.GuildVoice, position: 7 },
];

export const STUDENT_PERMISSIONS = [
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

export const ADMIN_ROLES = [
  'Equipe Pós-Tech',
  'Talent Lab',
  'Gestor acadêmico',
  'Coordenação',
  'Professores',
];

export const INITIAL_POSTS = [
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
      'Estamos começando com tudo, e vocês têm à disposição várias ferramentas tecnológicas incríveis que vão dar aquele boost nos estudos. 🚀\n\n🔧 [Visual Studio Code](https://visualstudio.microsoft.com/pt-br/vscode-edu/)\n\n🤖  [GitHub Pro e Copilot](https://education.github.com/pack)\n\n🐙 [GitKraken](https://www.gitkraken.com/github-student-developer-pack-bundle)\n\n☁️ [Azure](https://azure.microsoft.com/pt-br/free/students)\n\n💻 [JetBrains](https://www.jetbrains.com/academy/student-pack/)\n\n🎨 [Figma](https://www.figma.com/pt-br/education/)\n\n🎓 [Microsoft 365 Education Pack](https://www.microsoft.com/pt-br/microsoft-365/free-office-online-for-the-web)\n\nPara acessar esses benefícios, você precisa adicionar o seu email da FIAP (não sabe qual o seu? veja a thread sobre o email estudantil).\nQualquer dúvida, estamos por aqui para ajudar. 😉\n{mention}',
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
