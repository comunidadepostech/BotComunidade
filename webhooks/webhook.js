import express from 'express';
import handleCreateEvent from './services/createEvent.js';

// Para adicionar outro serviço em um novo endpoint, faça o seguinte:
// 1. Crie o arquivo com a lógica (ex: './updateEvent.js')
// 2. Importe a função dele: import { handleUpdateEvent } from './updateEvent.js';
// 3. Adicione a rota assim:
// this.app.post('/atualizarEvento', (req, res) => {
//     handleUpdateEvent(req, res, client);
// });

export default class Webhook {
    constructor() {
        this.app = express();
        this.port = process.env.PRIMARY_WEBHOOK_PORT;
    }

    start(bot) {
        this.app.use(express.json());

        this.app.post('/criarEvento', (req, res) => {
            handleCreateEvent(req, res, bot);
        });

        // Inicia o servidor para ouvir na porta definida
        this.app.listen(this.port, "0.0.0.0", () => {
            console.log(`LOG - Webhook iniciado na porta: ${this.port}`);
        });

    }
}


