var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class BaseCommand {
    constructor(build, options = {}) {
        if (!build) {
            throw new Error("Um comando deve ter uma construção.");
        }
        this.name = build.name;
        this.build = build;
        this.alwaysEnabled = options.alwaysEnabled || false;
    }
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`O comando ${this.name} precisa de um método execute()!`);
        });
    }
}
