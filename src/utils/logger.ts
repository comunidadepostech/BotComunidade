import fs from "node:fs";
import path from "node:path";

class Logger {
    logFileName: string;
    logStream: fs.WriteStream;
    colors: { [key: string]: string; };
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

    #log(level: string, message: string, color: string): void {
        const timestamp = new Date().toISOString();
        const fileMessage = `${timestamp} - ${level.toUpperCase()} - ${message}\n`;
        const consoleMessage = `${color}${timestamp} - ${level.toUpperCase()} - ${message}\x1b[0m`;

        const method = console[level as keyof Console];

        if (typeof method === 'function') {
            (method as Function)(consoleMessage); 
        } else {
            console.log(consoleMessage);
        }
        
        this.logStream.write(fileMessage);
    }

    log(message: string): void {
        this.#log('log', message, this.colors.white);
    }

    error(message: string): void {
        this.#log('error', message, this.colors.red);
    }

    debug(message: string): void {
        this.#log('debug', message, this.colors.blue);
    }

    warn(message: string): void {
        this.#log('warn', message, this.colors.yellow);
    }

    command(message: string): void {
        this.#log('log', message, this.colors.green);
    }

    info(message: string): void {
        this.#log('log', message, this.colors.green);
    }

    test(message: string): void {
        this.#log("test", message, this.colors.green)
    }
}

export default new Logger();