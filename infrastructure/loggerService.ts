import path from 'path';
import fs from 'fs';

export default class LoggerService {
    private static readonly logDir: string = path.join(process.cwd(), 'logs');
    private static readonly logFileName: string = path.join(this.logDir, `log-${new Date().toISOString().split('T')[0]}.txt`);

    // Garante que a pasta exista
    static {
        if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir);
    }

    private static readonly logStream: fs.WriteStream = fs.createWriteStream(this.logFileName, { flags: 'a' });

    private static readonly colors = {
        log: '\x1b[37m',   // white
        error: '\x1b[31m', // red
        debug: '\x1b[34m', // blue
        warn: '\x1b[33m',  // yellow
        info: '\x1b[32m'   // green
    };

    // Salva as funções originais para evitar recursão infinita
    private static readonly originalConsole = {
        log: console.log,
        error: console.error,
        debug: console.debug,
        warn: console.warn,
        info: console.info
    };

    public static init(): void {
        // Sobrescreve os métodos do console global
        (console as any).log = (...args: any[]) => this.handleLog('log', args);
        (console as any).error = (...args: any[]) => this.handleLog('error', args);
        (console as any).debug = (...args: any[]) => this.handleLog('debug', args);
        (console as any).warn = (...args: any[]) => this.handleLog('warn', args);
        (console as any).info = (...args: any[]) => this.handleLog('info', args);
    }

    private static handleLog(level: keyof typeof LoggerService.colors, args: any[]): void {
        // Converte objetos em JSON se necessário
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
        ).join(' ');

        const timestamp = new Date().toISOString();
        const color = this.colors[level] || this.colors.log;

        const fileMessage = `${timestamp} - ${level.toUpperCase()} - ${message}\n`;
        const consoleMessage = `${color}${timestamp} - ${level.toUpperCase()} - ${message}\x1b[0m`;

        // Escreve no arquivo
        this.logStream.write(fileMessage);

        // Chama o método original para exibir no terminal
        this.originalConsole[level](consoleMessage);
    }
}