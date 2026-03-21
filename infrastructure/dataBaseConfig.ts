import {env} from "../config/env.ts";

export const MySQLdatabaseConfig = {
    uri: env.MYSQL_DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}