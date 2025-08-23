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
    )
    .addIntegerOption(option =>
        option.setName('duration')
            .setDescription('Duração do convite em dias (0 para permanente)')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(365)
    )
    .addIntegerOption(option =>
        option.setName('uses')
            .setDescription('Número máximo de usos (0 para ilimitado)')
            .setRequired(false)
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
            .setRequired(true))
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

const create = new SlashCommandBuilder()
    .setName('create')
    .setDescription('Cria uma nova turma ou curso')
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

const event = new SlashCommandBuilder()
    .setName('event')
    .setDescription('Cria um evento no Discord, Zoom e no calendário')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName('title')
            .setDescription('Título do evento')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('date')
            .setDescription('Data do evento (dd/mm/aaaa)')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('time')
            .setDescription('Hora do evento (hh:mm)')
            .setRequired(true)
    )
    /*.addStringOption(option =>
        option.setName('passworld_required')
            .setDescription("Especifica se uma senha é necessaria para a reunião")
            .addChoices(
                {name: "true", value: true},
                {name: "false", value: false}
            )
    )*/
    .addStringOption(option =>
        option.setName("duration")
            .setDescription("Define a duração do evento em minutos")
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName("host_emails")
            .setDescription("E-mails dos organizadores do evento separados por , e sem espaço")
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName("recording")
            .setDescription("Define se o evento deve ser gravado (true/false)")
            .setRequired(true)
            .addChoices({name: "true", value: 0}, {name: "false", value: 1})
    )


export const slashCommands = [
    {name: "invite", commandBuild: invite},
    {name: "ping", commandBuild: ping},
    {name: "echo", commandBuild: echo},
    {name: "display", commandBuild: display},
    {name: "poll", commandBuild: poll},
    {name: "create", commandBuild: create},
    {name: "event", commandBuild: event}
]