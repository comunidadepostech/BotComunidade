var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MySQLDatabase } from "../../database.js";
import logger from "../../utils/logger.js";
export default function databaseTest() {
    return __awaiter(this, void 0, void 0, function* () {
        const database = new MySQLDatabase();
        yield database.connect(process.env.MYSQL_URL)
            .then(() => logger.test("Teste de conexão com banco de dados - Passou"))
            .catch((error) => { throw new Error(`Teste de conexão com banco de dados: Falhou\n${error}`); });
        yield database.endConnection();
    });
}
