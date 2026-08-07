import winston from 'winston';
import type ILoggerService from '../types/services/loggerService.interface';
import env from '../config/env';

const consoleFormat = env.DEBUG
    ? winston.format.combine(
          winston.format.colorize({ all: true }),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              return `[${timestamp}] ${level}: ${message}${metaString}`;
          }),
      )
    : winston.format.combine(winston.format.timestamp(), winston.format.json());

const winstonInstance = winston.createLogger({
    level: env.DEBUG ? 'debug' : 'info',
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
    ],
});

export class WinstonLogger implements ILoggerService {
    log(message: string, meta?: object): void {
        winstonInstance.info(message, { context: 'log', ...meta });
    }

    info(message: string, meta?: object): void {
        winstonInstance.info(message, { context: 'system', ...meta });
    }

    error(message: string, meta?: object): void {
        winstonInstance.error(message, { context: 'system', ...meta });
    }

    warn(message: string, meta?: object): void {
        winstonInstance.warn(message, { context: 'system', ...meta });
    }

    http(message: string, meta?: object): void {
        winstonInstance.http(message, { context: 'system', ...meta });
    }
}
