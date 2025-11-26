import {Events} from "discord.js";
import logger from "../../utils/logger.js";

export class ClientReady {
    constructor() {
        this.name = Events.ClientReady;
        this.once = true;
    }

    async execute() {
        logger.log("LOG - Bot iniciado")
    }
}