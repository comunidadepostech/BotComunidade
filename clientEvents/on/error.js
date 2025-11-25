import {Events} from "discord.js";

export class Err {
    constructor(){
        this.name = Events.Error;
        this.once = false;
    }

    async execute(packet){
        console.error(packet)
    }
}