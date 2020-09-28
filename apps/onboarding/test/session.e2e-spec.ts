import { ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from "@nestjs/typeorm"
import { AppModule } from '../src/app.module'
import { SessionModule } from '../src/session/session.module'
import { SessionService } from '../src/session/session.service'

describe('SessionController (e2e)', () => {
  let app
  let service: SessionService


  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule,
        SessionModule,
        TypeOrmModule.forRoot({
          "type": "postgres",
          "host": "localhost",
          "port": 5432,
          "username": "postgres",
          "password": "docker",
          "database": "postgres",
          "autoLoadEntities": true,
          "keepConnectionAlive": true,
          "synchronize": true
        })
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
      const session = await service.createSession('test')
      expect((await service.findOne(session.id)).externalAccount).toBe('test')
      expect((await service.findAll()).length).toBe(1)
      await service.removeSession(session.id)
    })

  })

  afterAll(async () => {
    await app.close()
  })
})
