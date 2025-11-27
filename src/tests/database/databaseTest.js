import { MySQLDatabase } from "../../database.js";
import logger from "../../utils/logger.js";

export default async function databaseTest() {
    const database = new MySQLDatabase();

    await database.connect(process.env.MYSQL_URL)
        .then(() => logger.test("Teste de conexão com banco de dados - Passou"))
        .catch((error) => {throw new Error(`Teste de conexão com banco de dados: Falhou\n${error}`)});

    await database.endConnection();
}