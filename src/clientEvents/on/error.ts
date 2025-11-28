import {Events} from "discord.js";
import logger from "../../utils/logger.js";

export class Err {
    name: string;
    once: boolean;
    constructor(){
        this.name = Events.Error;
        this.once = false;
    }

    async execute(packet: Error){
        logger.error(packet.message)
    }
}