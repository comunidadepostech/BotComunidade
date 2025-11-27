var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Events } from "discord.js";
import logger from "../../utils/logger.js";
export class ClientReady {
    constructor() {
        this.name = Events.ClientReady;
        this.once = true;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.log("LOG - Bot iniciado");
        });
    }
}
