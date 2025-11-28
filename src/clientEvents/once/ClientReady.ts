import {Events} from "discord.js";
import logger from "../../utils/logger.js";

export class ClientReady {
    name: string;
    once: boolean;
    constructor() {
        this.name = Events.ClientReady;
        this.once = true;
    }

    async execute() {
        logger.log("LOG - Bot iniciado")
    }
}