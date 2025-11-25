import {Events} from "discord.js";

export class ClientReady {
    constructor() {
        this.name = Events.ClientReady;
        this.once = true;
    }

    async execute() {
        console.log("LOG - Bot iniciado")
    }
}