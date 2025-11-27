var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _MySQLDatabase_client;
import mysql from "mysql2/promise";
import logger from "./utils/logger.js";
export class MySQLDatabase {
    constructor() {
        _MySQLDatabase_client.set(this, null);
    }
    connect(url) {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldSet(this, _MySQLDatabase_client, yield mysql.createConnection(url), "f");
        });
    }
    verifyTables() {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`CREATE TABLE IF NOT EXISTS invites (
            invite CHAR(10) PRIMARY KEY,
            role VARCHAR(100) NOT NULL,
            server_id VARCHAR(19) NOT NULL
        )`);
            yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`CREATE TABLE IF NOT EXISTS flags (
            server_id CHAR(19) NOT NULL PRIMARY KEY,
            flag TEXT NOT NULL
        )`);
        });
    }
    saveInvite(invite, role, serverId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`INSERT INTO invites (invite, role, server_id) VALUES (?, ?, ?)`, [invite, role, serverId]);
        });
    }
    getInvite(invite) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`SELECT * FROM invites WHERE invite = ?`, [invite]);
            return rows[0] || null;
        });
    }
    deleteInvite(invite) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`DELETE FROM invites WHERE invite = ?`, [invite]);
        });
    }
    getAllInvites() {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`SELECT * FROM invites`);
            return rows;
        });
    }
    getFlags() {
        return __awaiter(this, arguments, void 0, function* (serverId = null) {
            let rows;
            if (serverId) {
                [rows] = yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`SELECT * FROM flags WHERE server_id = ?`, [serverId]);
            }
            else {
                [rows] = yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`SELECT * FROM flags`);
            }
            const flags = {};
            for (const { server_id, flag } of rows) {
                flags[server_id] = JSON.parse(flag);
            }
            return flags;
        });
    }
    updateFlag(serverId, flagName, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const [rows] = yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`SELECT flag FROM flags WHERE server_id = ?`, [serverId]);
            let flags = {};
            if (rows.length > 0 && rows[0].flag) {
                flags = JSON.parse(rows[0].flag);
            }
            flags[flagName] = value;
            yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`INSERT INTO flags (server_id, flag)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE flag = VALUES(flag)`, [serverId, JSON.stringify(flags)]);
        });
    }
    saveFlags(guildId, flags) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").query(`INSERT INTO flags (server_id, flag) VALUES (?, ?) ON DUPLICATE KEY UPDATE flag = VALUES(flag)`, [guildId, JSON.stringify(flags)]);
        });
    }
    createNewFlag(name, defaultValue) {
        return __awaiter(this, void 0, void 0, function* () {
            let flags = yield this.getFlags();
            for (let serverID of Object.keys(flags)) {
                flags[serverID][name] = defaultValue;
                yield this.saveFlags(serverID, flags[serverID]);
            }
        });
    }
    checkFlags(flags, defaultFlags, client) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Object.keys(flags).length === 0) {
                for (const [, guild] of client.guilds.cache) {
                    logger.debug(`DEBUG - Salvando flags padrão para ${guild.id}\n${JSON.stringify(defaultFlags)}`);
                    yield this.saveFlags(guild.id, defaultFlags);
                }
                return true;
            }
            if (Object.keys(flags[Object.keys(flags)[0]]).join() !== Object.keys(defaultFlags).join()) {
                let differences = Object.keys(defaultFlags).filter(x => !Object.keys(flags[Object.keys(flags)[0]]).includes(x));
                for (let difference of differences) {
                    logger.debug(`DEBUG - Nova flag detectada: ${difference}`);
                    yield this.createNewFlag(difference, defaultFlags[difference]);
                }
                return true;
            }
            return false;
        });
    }
    endConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _MySQLDatabase_client, "f").end();
        });
    }
}
_MySQLDatabase_client = new WeakMap();
