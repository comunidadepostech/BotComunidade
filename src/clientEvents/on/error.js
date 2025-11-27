import {Events} from "discord.js";
import logger from "../../utils/logger.js";

export class Err {
    constructor(){
        this.name = Events.Error;
        this.once = false;
    }

    async execute(packet){
        logger.error(packet)
    }
}