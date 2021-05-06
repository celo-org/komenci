module.exports = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || '0.0.0.0',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'docker',
    database: process.env.DB_DATABASE || 'postgres',
    entities: ['./src/blocks/notifiedBlock.entity.ts',
               './src/invite/inviteReward.entity.ts'],
    synchronize: process.env.DB_SYNCHRONIZE === "false",
    migrationsTableName: "migration",
    migrations: [
        "./src/migrations/*.ts"
    ],
    cli: {
        migrationsDir: "./src/migrations"
    }
}
