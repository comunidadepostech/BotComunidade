import {Events} from "discord.js";

export class Debug {
    constructor(){
        this.name = Events.Debug;
        this.once = false;
    }

    async execute(_, packet){
        //console.debug(packet)
    }
}