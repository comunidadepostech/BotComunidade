var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Logger_instances, _Logger_log;
import fs from "node:fs";
import path from "node:path";
class Logger {
    constructor() {
        _Logger_instances.add(this);
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
        };
    }
    log(message) {
        __classPrivateFieldGet(this, _Logger_instances, "m", _Logger_log).call(this, 'log', message, this.colors.white);
    }
    error(message) {
        __classPrivateFieldGet(this, _Logger_instances, "m", _Logger_log).call(this, 'error', message, this.colors.red);
    }
    debug(message) {
        __classPrivateFieldGet(this, _Logger_instances, "m", _Logger_log).call(this, 'debug', message, this.colors.blue);
    }
    warn(message) {
        __classPrivateFieldGet(this, _Logger_instances, "m", _Logger_log).call(this, 'warn', message, this.colors.yellow);
    }
    command(message) {
        __classPrivateFieldGet(this, _Logger_instances, "m", _Logger_log).call(this, 'log', message, this.colors.green);
    }
    test(message) {
        __classPrivateFieldGet(this, _Logger_instances, "m", _Logger_log).call(this, "test", message, this.colors.green);
    }
}
_Logger_instances = new WeakSet(), _Logger_log = function _Logger_log(level, message, color) {
    const timestamp = new Date().toISOString();
    const fileMessage = `${timestamp} - ${level.toUpperCase()} - ${message}\n`;
    const consoleMessage = `${color}${timestamp} - ${level.toUpperCase()} - ${message}\x1b[0m`;
    if (console[level]) {
        console[level](consoleMessage);
    }
    else {
        console.log(consoleMessage);
    }
    this.logStream.write(fileMessage);
};
export default new Logger();
