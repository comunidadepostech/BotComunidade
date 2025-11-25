import {serverNames} from "../../utils/servers.js";

// Para testes use o seguinte comando (modifique-o como quiser e lembre-se de ter a turma "test" cadastrada):
// curl -X POST localhost/criarEvento -H "Content-Type: application/json" -d '{"turma": "test","nomeEvento": "Aula de Teste via API","tipo": "Live","data_hora": "2025-12-20T19:00:00-03:00","fim": "2025-12-20T21:00:00-03:00","link": "https://meet.google.com/seu-link-da-aula"}'

async function createScheduledEvent(bot, eventData) {
    const { turma, nomeEvento, tipo, data_hora, link, fim } = eventData

    // Discord não permite cadastrar eventos com o nome maior que 100 caracteres
    if (nomeEvento.length > 100) {throw new Error("O nome da aula ultrapassa 100 caracteres, busque reduzir a quantidade de caracteres.");}

    // Tenta dar fetch na guild do evento usando a nomenclatura da turma
    const guild = await bot.client.guilds.fetch(serverNames[turma.replaceAll(/\d+/g, '').replaceAll(" ", "")]);

    // Se o servidor não for encontrado retorna um erro
    if (!guild) {throw new Error(`Servidor de ${turma.replaceAll(/\d+/g, '')} não encontrado`);}

    // Busca os canais da guild da turma
    const channels = await guild.channels.fetch();

    // Filtra os canais buscando pelo canal de avisos e pelo parente que deve ser a turma
    const voiceChannel = channels.find(channel => channel.name === `📒│Sala de estudo ${turma}` && channel.type === 2);

    // Se o canal de voz não for encontrado retorna um erro
    if (!voiceChannel) {throw new Error(`Canal de voz para a turma ${turma} não encontrado.`);}

    const defaultEventDescription = {
        "Grupo de estudos": "Olá, turma!\n" +
            " \n" +
            "Temos um encontro marcado, onde você terá a oportunidade de compartilhar seus conhecimentos, discutir suas dificuldades e contribuir para um ambiente positivo de estudos. \n" +
            "\n" +
            "Não perca o bate papo do Grupo de Estudos!\n" +
            " \n" +
            "Obs: Este momento não será gravado\n",
        "Live": (link) => `Lembre-se que a live será no Zoom através do link: ${link}\n` +
            "\n" +
            "Obs.: Todas as lives serão gravadas e disponibilizadas no dia seguinte para a turma no canal #gravações",
        "Mentoria": "Olá, turma!\n" +
            " \n" +
            "Temos um encontro marcado, onde você terá a oportunidade de compartilhar seus conhecimentos, discutir suas dificuldades e contribuir para um ambiente positivo de estudos. \n" +
            "\n" +
            "Não perca o bate papo da Mentoria!\n" +
            " \n" +
            "Obs: Este momento não será gravado"
    }

    // Define qual a descrição do evento baseado no tipo de evento
    let description = typeof defaultEventDescription[tipo] === "function" ? defaultEventDescription[tipo](link) : defaultEventDescription[tipo];

    // Retorna o evento criado
    return guild.scheduledEvents.create({
        name: `${turma} - ${nomeEvento}`,
        scheduledStartTime: new Date(data_hora),
        scheduledEndTime: new Date(fim),
        privacyLevel: 2,
        entityType: 2,
        channel: voiceChannel.id,
        description: description,
        image: './assets/postech.png'
    });
}

export default async function handleCreateEvent(req, res, client) {
    console.debug('DEBUG - Dados recebidos para criar evento: ', req.body);
    try {
        const scheduledEvent = await createScheduledEvent(client, req.body);
        console.log(`LOG - Evento ${scheduledEvent.name} criado com sucesso`);
        res.status(201).json({ status: 'sucesso', evento: scheduledEvent });
    } catch (error) {
        console.error(`ERRO - Falha ao criar evento via webhook:`, error);
        res.status(500).json({ status: 'erro', mensagem: JSON.stringify(error.message.json, null, 2) });
    }
}
