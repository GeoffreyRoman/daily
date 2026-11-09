"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    host: 'postgresql-geoffreyr.alwaysdata.net',
    port: 5432,
    database: 'geoffreyr_pg',
    user: 'geoffreyr',
    password: 'dijqaV-ninte7-gecxar',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.default = pool;
//# sourceMappingURL=database.js.map