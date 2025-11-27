export class BaseCommand {
    constructor(build, options = {}) {
        if (!build) {
            throw new Error("Um comando deve ter uma construção.");
        }

        this.name = build.name;
        this.build = build
        this.alwaysEnabled = options.alwaysEnabled || false;
    }

    async execute(interaction) {
        throw new Error(`O comando ${this.name} precisa de um método execute()!`);
    }
}