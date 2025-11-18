import {Events} from "discord.js";

export class Warning {
    constructor(){
        this.name = Events.Warn;
        this.once = false;
    }

    async execute(_, packet){
        //console.warn(packet)
    }
}