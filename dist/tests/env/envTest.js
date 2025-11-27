var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import logger from "../../utils/logger.js";
export default function envTest() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.EVENT_CHECK_TIME) {
            logger.test("Verificação de variável de ambiente EVENT_CHECK_TIME - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente EVENT_CHECK_TIME - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.DAY_FOR_MONTH_TASKS) {
            logger.test("Verificação de variável de ambiente DAY_FOR_MONTH_TASKS - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente DAY_FOR_MONTH_TASKS - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.MEMBERS_CHECK_TIME) {
            logger.test("Verificação de variável de ambiente MEMBERS_CHECK_TIME - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente MEMBERS_CHECK_TIME - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.EVENT_DIFF_FOR_WARNING) {
            logger.test("Verificação de variável de ambiente EVENT_DIFF_FOR_WARNING - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente EVENT_DIFF_FOR_WARNING - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.PRIMARY_WEBHOOK_PORT) {
            logger.test("Verificação de variável de ambiente PRIMARY_WEBHOOK_PORT - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente PRIMARY_WEBHOOK_PORT - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.ID) {
            logger.test("Verificação de variável de ambiente ID - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente ID - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.PUBLIC_KEY) {
            logger.test("Verificação de variável de ambiente PUBLIC_KEY - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente PUBLIC_KEY - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.TOKEN) {
            logger.test("Verificação de variável de ambiente TOKEN - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente TOKEN - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.MYSQL_URL) {
            logger.test("Verificação de variável de ambiente MYSQL_URL - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente MYSQL_URL - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.N8N_ENDPOINT) {
            logger.test("Verificação de variável de ambiente N8N_ENDPOINT - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente N8N_ENDPOINT - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
        if (process.env.N8N_TOKEN) {
            logger.test("Verificação de variável de ambiente N8N_TOKEN - Passou");
        }
        else {
            throw new Error('Verificação de variável de ambiente N8N_TOKEN - Falhou\nVerifique se todas as variáveis de ambiente estão definidas corretamente');
        }
    });
}
