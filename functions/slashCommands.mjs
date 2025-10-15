import {SlashCommandBuilder, PermissionFlagsBits} from "discord.js"

// Comando de invite, cria um convite que pode ser vinculado a um cargo e a um canal específico.
const invite = new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Cria um convite para o servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Canal para criar o convite')
            .setRequired(true)
    )
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('Cargo ao qual o convite deve ser vinculado')
            .setRequired(true)
    );

// Comando de teste, serve para saber se o ‘Bot’ está a responder para ajudar na resolução de problemas
const ping = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Responde com Pong!')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// Echo serve para replicar uma mensagem para um ou mais canais definidos pelo usuário
const echo = new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Replica uma mensagem para determinado canal")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
        option.setName("channel")
            .setDescription("Canal no qual a mensagem deve ser enviada")
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName("message")
            .setDescription("Conteúdo da mensagem")
            .setRequired(true)
            .setMinLength(1)
    )

// Display serve para exibir os convites ativos do servidor
const display = new SlashCommandBuilder()
    .setName("display")
    .setDescription("Exibe os convites ativos do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// Poll serve para criar uma enquete
const poll = new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Cria uma enquete interativa')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('question')
            .setDescription('Pergunta da enquete')
            .setRequired(true)
            .setMaxLength(300)
    )
    .addIntegerOption(option =>
        option.setName('duration')
            .setDescription('Duração da enquete em horas')
            .setRequired(true)
            .addChoices(
                { name: '1 hora', value: 1 },
                { name: '2 horas', value: 2 },
                { name: '6 horas', value: 6 },
                { name: '12 horas', value: 12 },
                { name: '1 dia', value: 24 },
                { name: '3 dias', value: 72 },
                { name: '5 dias', value: 120 },
                { name: '7 dias', value: 168 },
                { name: '14 dias', value: 336}
            )
    )
    .addStringOption(option =>
        option.setName('option1')
            .setDescription('Primeira opção')
            .setRequired(true)
            .setMaxLength(55))
    .addStringOption(option =>
        option.setName('option2')
            .setDescription('Segunda opção')
            .setRequired(true)
            .setMaxLength(55))
    .addStringOption(option =>
        option.setName('option3')
            .setDescription('Terceira opção')
            .setRequired(false)
            .setMaxLength(55))
    .addStringOption(option =>
        option.setName('option4')
            .setDescription('Quarta opção')
            .setRequired(false)
            .setMaxLength(55))
    .addStringOption(option =>
        option.setName('option5')
            .setDescription('Quinta opção')
            .setRequired(false)
            .setMaxLength(55))
    .addStringOption(option =>
        option.setName('option6')
            .setDescription('Sexta opção')
            .setRequired(false)
            .setMaxLength(55))
    .addStringOption(option =>
        option.setName('option7')
            .setDescription('Setima opção')
            .setRequired(false)
            .setMaxLength(55))
    .addStringOption(option =>
        option.setName('option8')
            .setDescription('Oitava opção')
            .setRequired(false)
            .setMaxLength(55))
    .addStringOption(option =>
        option.setName('option9')
            .setDescription('Nona opção')
            .setRequired(false)
            .setMaxLength(55))
    .addStringOption(option =>
        option.setName('option10')
            .setDescription('Décima opção')
            .setRequired(false)
            .setMaxLength(55))
    .addIntegerOption(option =>
        option.setName('allow-multiselect')
            .setDescription('Permite múltipla seleção de opções (padrão: 0 para false)')
            .setRequired(false)
            .addChoices(
                { name: 'true', value: 1 },
                { name: 'false', value: 0 }
            )
    );

const createclass = new SlashCommandBuilder()
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
    );

const extract = new SlashCommandBuilder()
    .setName("extract")
    .setDescription("Extrai o conteúdo do chat e retorna um arquivo .txt")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

const event = new SlashCommandBuilder()
    .setName('event')
    .setDescription('Cria um evento')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('topic')
            .setDescription('Tópico do evento')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('date')
            .setDescription('Data (yyyy-MM-dd)')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('time')
            .setDescription('Hora (HH:mm)')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('description')
            .setDescription('Descrição do evento')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('link')
            .setDescription('Link do evento')
            .setRequired(true)
    )
    .addAttachmentOption(option =>
        option.setName("background")
            .setDescription("Imagem de fundo do evento")
            .setRequired(true)
    );

export const slashCommands = [
    {name: "invite", commandBuild: invite},
    {name: "ping", commandBuild: ping},
    {name: "echo", commandBuild: echo},
    {name: "display", commandBuild: display},
    {name: "poll", commandBuild: poll},
    {name: "createclass", commandBuild: createclass},
    {name: "extract", commandBuild: extract},
    {name: "event", commandBuild: event},
]