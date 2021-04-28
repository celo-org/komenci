"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("@nestjs/config");
var session_entity_1 = require("../session/session.entity");
exports.databaseConfig = config_1.registerAs('database', function () { return ({
    host: process.env.DB_HOST || '0.0.0.0',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    type: 'postgres',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'docker',
    database: process.env.DB_DATABASE || 'postgres',
    entities: [session_entity_1.Session],
    migrations: ['../migrations/*.ts'],
    migrationsTableName: "migrations_typeorm",
    migrationsRun: process.env.DB_MIGRATIONS === 'true',
    keepConnectionAlive: true,
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.DB_SYNCHRONIZE === 'false',
}); });
