import { ConfigType, registerAs } from '@nestjs/config'
import { NotifiedBlock } from '../blocks/notifiedBlock.entity'
import { InviteReward } from '../invite/inviteReward.entity'

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || '0.0.0.0',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  type: 'postgres' as const,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'docker',
  database: process.env.DB_DATABASE || 'postgres',
  entities: [InviteReward, NotifiedBlock],
  migrations: ['../migrations/*.ts'],
  migrationsTableName: 'migrations_typeorm',
  migrationsRun: process.env.DB_MIGRATIONS === 'true',
  keepConnectionAlive: true,
  ssl: process.env.DB_SSL === 'true',
  synchronize: process.env.DB_SYNCHRONIZE === 'true'
}))

export type DatabaseConfig = ConfigType<typeof databaseConfig>
