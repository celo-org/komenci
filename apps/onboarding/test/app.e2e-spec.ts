import { ValidationPipe } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { assert } from 'console'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { AuthenticatedGuard } from '../src/session/guards/authenticated.guard'

describe('AppController (e2e)', () => {
  let app

  const guardsMock = {
    canActivate: jest.fn(async () => true)
  }
  const jwtMock = {
    verify: jest.fn()
  }

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })    
    .overrideGuard(AuthenticatedGuard).useValue(guardsMock)
    .overrideProvider(JwtService).useValue(jwtMock)
    .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()
  })

  describe('/ (POST) startSession', () => {
    it('Returns 400 with empty body', async () => {
      return request(app.getHttpServer())
        .post('/startSession')
        .expect(400)
    })
  })

  describe('/ (POST) distributedBlindedPepper', () => {
    it('Returns 400 with empty body', async () => {
      return request(app.getHttpServer())
        .post('/distributedBlindedPepper')
        .expect(400)
    })

    it('Returns 400 with invalid phone number', async () => {
      return request(app.getHttpServer())
        .post('/distributedBlindedPepper')
        .send({
          e164Number: 'invalid'
        })
        .expect(400)
        .then(res => {
          assert(res.body.message, ['e164Number must be a valid phone number'])
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
