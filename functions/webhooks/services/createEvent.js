import { defaultEventDescription } from "../../../utils/defaultEventDescription.js";
import { classChannels } from "../../../utils/classPatterns.js";
import { serverNames } from "../../../utils/servers.js";

// Para testes use o seguinte comando (modifique-o como quiser e lembre-se de ter a turma "test" cadastrada):
// curl -X POST localhost/criarEvento -H "Content-Type: application/json" -d '{"turma": "test","nomeEvento": "Aula de Teste via API","tipo": "Live","data_hora": "2025-12-20T19:00:00-03:00","fim": "2025-12-20T21:00:00-03:00","link": "https://meet.google.com/seu-link-da-aula"}'

async function createScheduledEvent(client, eventData) {
    const { turma, nomeEvento, tipo, data_hora, link, fim } = eventData;

    if (nomeEvento.length > 100) {throw new Error("O nome da aula ultrapassa 100 caracteres, busque reduzir a quantidade de caracteres.");}

    const guild = await client.guilds.fetch(serverNames[turma.replace(/\d+/g, '').replace(" ", "")]);

    if (!guild) {throw new Error(`Servidor de ${turma.replace(/\d+/g, '')} não encontrado`);}

    const channels = await guild.channels.fetch();
    const voiceChannel = channels.find(c => c.name === classChannels[7].name + turma && c.type === 2);

    if (!voiceChannel) {throw new Error(`Canal de voz para a turma ${turma} não encontrado.`);}

    let description = defaultEventDescription[tipo] instanceof Function
        ? defaultEventDescription[tipo](link)
        : defaultEventDescription[tipo];

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

export async function handleCreateEvent(req, res, client) {
    console.debug('DEBUG - Dados recebidos para criar evento: ', req.body);
    try {
        const scheduledEvent = await createScheduledEvent(client, req.body);
        console.log(`LOG - Evento ${scheduledEvent.name} criado com sucesso`);
        res.status(201).json({ status: 'sucesso', evento: scheduledEvent });
    } catch (error) {
        console.error(`ERRO - Falha ao criar evento via webhook:`, error);
        res.status(500).json({ status: 'erro', mensagem: error.message });
    }
}
