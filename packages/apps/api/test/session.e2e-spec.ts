import { ValidationPipe } from '@nestjs/common'
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Connection, Repository } from 'typeorm'
import { databaseConfig } from '../src/config/database.config'
import { quotaConfig } from '../src/config/quota.config'
import { Session } from '../src/session/session.entity'
import { SessionModule } from '../src/session/session.module'
import { SessionService } from '../src/session/session.service'

describe('SessionController (e2e)', () => {
  let app
  let service: SessionService
  let repo: Repository<Session>
  let conn: Connection


  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        SessionModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig, quotaConfig],
          envFilePath: ['apps/onboarding/.env.test']
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigService],
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => config.get<ConfigType<typeof databaseConfig>>('database')
        }),
      ],
      providers: [SessionService]
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    service = moduleFixture.get<SessionService>(SessionService)
    repo = moduleFixture.get<Repository<Session>>(getRepositoryToken(Session))
    conn = moduleFixture.get<Connection>(Connection)

    await app.init()
  })

  afterAll(async () => {
    await conn.close()
    await app.close()
  })

  describe('Session CRUD', () => {
    it('should be defined', () => {
        expect(service).toBeDefined()
      })

    it('Create a new Session object in the database', async () => {
      const previousCount = await repo.count()
      const session = await service.create('test')
      expect((await service.findOne(session.id)).externalAccount).toBe('test')
      expect(await repo.count()).toBe(previousCount + 1)
      await service.removeSession(session.id)
    })

  })

})
