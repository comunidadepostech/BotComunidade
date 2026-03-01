export const MySQLdatabaseConfig = {
    uri: process.env.MYSQL_DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}