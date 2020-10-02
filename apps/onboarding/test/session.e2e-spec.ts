import { databaseConfig } from '@app/onboarding/config/database.config'
import { ValidationPipe } from '@nestjs/common'
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from "@nestjs/typeorm"
import { SessionModule } from '../src/session/session.module'
import { SessionService } from '../src/session/session.service'

describe('SessionController (e2e)', () => {
  let app
  let service: SessionService


  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        SessionModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig],
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

    await app.init()
  })

  describe('Session CRUD', () => {
    it('should be defined', () => {
        expect(service).toBeDefined()
      })

    it('Create a new Session object in the database', async () => {
      const previousNumber = await (await service.findAll()).length
      const session = await service.createSession('test')
      expect((await service.findOne(session.id)).externalAccount).toBe('test')
      expect(await (await service.findAll()).length).toBe(previousNumber + 1)
      await service.removeSession(session.id)
    })

  })

  afterAll(async () => {
    await app.close()
  })
})
