/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import fs from 'fs';
import {env} from "../config/env.ts";

export default class LoggerService {
    private static readonly logDir: string = path.join(process.cwd(), 'logs');
    private static readonly logFileName: string = path.join(this.logDir, `log-${new Date().toISOString().split('T')[0]}.txt`);

    // Inicia como null. Só vai receber um Stream se a env estiver ativa.
    private static logStream: fs.WriteStream | null = null;

    private static readonly colors = {
        log: '\x1b[37m',   // white
        error: '\x1b[31m', // red
        debug: '\x1b[34m', // blue
        warn: '\x1b[33m',  // yellow
        info: '\x1b[32m'   // green
    };

    private static readonly originalConsole = {
        log: console.log,
        error: console.error,
        debug: console.debug,
        warn: console.warn,
        info: console.info,
        time: console.time,
        timeEnd: console.timeEnd
    };

    private static isDebugMode(): boolean {
        return env.DEBUG;
    }

    private static isSaveLogsLocally(): boolean {
        return env.SAVE_LOGS_LOCALLY;
    }

    public static init(): void {
        // Checa se deve salvar localmente ANTES de criar a pasta ou o arquivo
        if (this.isSaveLogsLocally()) {
            if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir);
            this.logStream = fs.createWriteStream(this.logFileName, { flags: 'a' });
        }

        // Sobrescreve os métodos do console global (padrões)
        (console as any).log = (...args: any[]) => this.handleLog('log', args);
        (console as any).error = (...args: any[]) => this.handleLog('error', args);
        (console as any).warn = (...args: any[]) => this.handleLog('warn', args);
        (console as any).info = (...args: any[]) => this.handleLog('info', args);

        // Sobrescreve métodos de debug condicionalmente
        (console as any).debug = (...args: any[]) => {
            if (this.isDebugMode()) this.handleLog('debug', args);
        };

        (console as any).time = (label?: string) => {
            if (this.isDebugMode()) this.originalConsole.time(label);
        };

        (console as any).timeEnd = (label?: string) => {
            if (this.isDebugMode()) this.originalConsole.timeEnd(label);
        };
    }

    private static handleLog(level: keyof typeof LoggerService.colors, args: any[]): void {
        // Converte objetos em JSON se necessário
        const message = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
        ).join(' ');

        const timestamp = new Date().toISOString();
        const color = this.colors[level] || this.colors.log;

        const consoleMessage = `${color}${timestamp} - ${level.toUpperCase()} - ${message}\x1b[0m`;

        // Chama o método original para exibir no terminal SEMPRE
        this.originalConsole[level](consoleMessage);

        // Escreve no arquivo APENAS se o stream foi inicializado (SAVE_LOGS_LOCALLY ativo)
        if (this.logStream) {
            const fileMessage = `${timestamp} - ${level.toUpperCase()} - ${message}\n`;
            this.logStream.write(fileMessage);
        }
    }
}