import fs from "node:fs";
import path from "node:path";

class Logger {
    constructor() {
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        this.logFileName = path.join(logDir, `log-${new Date().toISOString().split('T')[0]}.txt`);
        this.logStream = fs.createWriteStream(this.logFileName, { flags: 'a' });
        this.colors = {
            green: '\x1b[32m',
            red: '\x1b[31m',
            blue: '\x1b[34m',
            yellow: '\x1b[33m',
            white: '\x1b[37m'
        }
    }

    #log(level, message, color) {
        const timestamp = new Date().toISOString();
        const fileMessage = `${timestamp} - ${level.toUpperCase()} - ${message}\n`;
        const consoleMessage = `${color}${timestamp} - ${level.toUpperCase()} - ${message}\x1b[0m`;

        if (console[level]) {
            console[level](consoleMessage);
        } else {
            console.log(consoleMessage);
        }
        
        this.logStream.write(fileMessage);
    }

    log(message) {
        this.#log('log', message, this.colors.white);
    }

    error(message) {
        this.#log('error', message, this.colors.red);
    }

    debug(message) {
        this.#log('debug', message, this.colors.blue);
    }

    warn(message) {
        this.#log('warn', message, this.colors.yellow);
    }

    command(message) {
        this.#log('log', message, this.colors.green);
    }
}

export default new Logger();