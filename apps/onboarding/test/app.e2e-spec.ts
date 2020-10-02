import { AuthService, TokenPayload } from '@app/onboarding/auth/auth.service'
import { DeviceType, StartSessionDto } from '@app/onboarding/dto/StartSessionDto'
import { GatewayService } from '@app/onboarding/gateway/gateway.service'
import { Session } from '@app/onboarding/session/session.entity'
import { SessionService } from '@app/onboarding/session/session.service'
import { ValidationPipe } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { assert } from 'console'
import { isRight } from 'fp-ts/Either'
import { Connection, EntityManager, QueryRunner, Repository } from 'typeorm'
import Web3 from 'web3'
import { AppModule } from '../src/app.module'
const request = require('supertest')

jest.mock('@app/onboarding/gateway/gateway.service')

describe('AppController (e2e)', () => {
  // @ts-ignore
  const gatewayService = new GatewayService()
  let sessionService: SessionService
  let sessionRepository: Repository<Session>
  let authService: AuthService
  let jwtService: JwtService
  let manager: EntityManager
  let dbConn: Connection
  let app


  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).overrideProvider(GatewayService).useValue(gatewayService)
      .compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()

    sessionService = module.get<SessionService>(SessionService)
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session))
    jwtService = module.get<JwtService>(JwtService)
    dbConn = module.get<Connection>(Connection)
    manager = module.get<EntityManager>(EntityManager)
    authService = module.get<AuthService>(AuthService)
    // @ts-ignore
    manager.queryRunner = dbConn.createQueryRunner("master")
    manager.queryRunner.clearTable("session")
  })

  afterAll(async () => {
    await app.close()
    await manager.queryRunner.release()
    await dbConn.close()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await manager.queryRunner.rollbackTransaction()
  })

  beforeEach(async () => {
    await manager.queryRunner.startTransaction()
  })

  describe('/ (POST) startSession', () => {
    const startSessionPayload = (eoa: string): StartSessionDto => ({
      captchaResponseToken: "sda",
      deviceType: DeviceType.iOS,
      iosDeviceToken: "asdas",
      externalAccount: eoa,
    })

    describe('with invalid payloads', () => {
      it('Returns 400 with empty body', async () => {
        const resp = await request(app.getHttpServer()).post('/startSession')
        expect(resp.statusCode).toBe(400)
      })

      it('Returns 400 with an invalid body', async () => {
        const resp = await request(app.getHttpServer()).post('/startSession').send({
          notThatRight: 'payload'
        })
        expect(resp.statusCode).toBe(400)
      })

      it('Returns 400 with an invalid ethereum address', async () => {
        const payload = startSessionPayload("not-an-address")
        const resp = await request(app.getHttpServer()).post('/startSession').send(payload)
        expect(resp.statusCode).toBe(400)
        expect(resp.body.message[0]).toMatch(/must be a valid Celo address/)
      })
    })

    describe("with a valid payload", () => {
      const eoa = Web3.utils.randomHex(20)
      describe("when the gateway does not pass", () => {
        let gatewayVerify: jest.SpyInstance
        beforeEach(() => {
          gatewayVerify = jest.spyOn(gatewayService, 'verify').mockResolvedValue(false)
        })

        it("Returns 403 with an error", async () => {
          const payload = startSessionPayload(eoa)
          const resp = await request(app.getHttpServer()).post('/startSession').send(payload)
          expect(resp.statusCode).toEqual(403)
          expect(resp.body).toMatchObject({
            statusCode: 403,
            message: 'Forbidden'
          })
        })
      })

      describe("when the gateway passes", () => {
        let gatewayVerify: jest.SpyInstance
        beforeEach(() => {
          gatewayVerify = jest.spyOn(gatewayService, 'verify').mockResolvedValue(true)
        })

        const decodeToken = (token: string): TokenPayload => {
          const decodeResp = TokenPayload.decode(jwtService.verify(token))
          expect(isRight(decodeResp)).toBe(true)
          // @ts-ignore - we're expecting
          return decodeResp.right
        }

        const subject = async () => {
          const payload = startSessionPayload(eoa)
          const resp = await request(app.getHttpServer()).post('/startSession').send(payload)
          expect(resp.status).toEqual(201)
          return resp
        }

        describe("when no session exist for the account", () => {
          it('creates a new session and returns the id in a token', async () => {
            const save = jest.spyOn(sessionRepository, 'save')
            const resp = await subject()
            const tokenPayload = decodeToken(resp.body.token)

            expect(save).toHaveBeenCalled()
            const session = await sessionRepository.findOne(tokenPayload.sessionId)
            expect(session).toBeDefined()
            expect(session.externalAccount).toEqual(eoa)
          })
        })

        describe("when a session already exists", () => {
          describe("but it's closed", () => {
            it("creats a new session and returns the id in a token", async() => {
              const oldSess = await sessionService.createSession(eoa)
              oldSess.completedAt = new Date(Date.now()).toISOString()
              await sessionRepository.save(oldSess)

              const save = jest.spyOn(sessionRepository, 'save')
              const payload = startSessionPayload(eoa)
              const resp = await subject()
              const tokenPayload = decodeToken(resp.body.token)

              expect(save).toHaveBeenCalled()
              const session = await sessionRepository.findOne(tokenPayload.sessionId)
              expect(session).toBeDefined()
              expect(session.externalAccount).toEqual(eoa)
              expect(await sessionRepository.count()).toEqual(2)
            })
          })

          describe("and it's open", () => {
            it("reuses the same session", async () => {
              const oldSess = await sessionService.createSession(eoa)
              await sessionRepository.save(oldSess)

              const save = jest.spyOn(sessionRepository, 'save')
              const payload = startSessionPayload(eoa)
              const resp = await subject()
              const tokenPayload = decodeToken(resp.body.token)

              expect(tokenPayload.sessionId).toEqual(oldSess.id)
              expect(await sessionRepository.count()).toEqual(1)
            })
          })
        })
      })
    })
  })

  describe('/ (POST) distributedBlindedPepper', () => {
    const eoa = Web3.utils.randomHex(20)
    let token: string

    describe('without a token', () => {
      it('Returns 401', async () => {
        return request(app.getHttpServer())
          .post('/distributedBlindedPepper')
          .expect(401)
      })
    })

    describe('with a token', () => {
      beforeEach(async () => {
        token = await authService.startSession(eoa)
        console.log(token)
      })

      describe('with an invalid payload', () => {
        it('Returns 400 with empty body', async () => {
          const resp = await request(app.getHttpServer())
            .post('/distributedBlindedPepper')
            .set('Authorization', `Bearer ${token}`)
          expect(resp.statusCode).toBe(400)
        })

        it('Returns 400 with invalid phone number', async () => {
          return request(app.getHttpServer())
            .post('/distributedBlindedPepper')
            .set('Authorization', `Bearer ${token}`)
            .send({
              e164Number: 'invalid'
            })
            .expect(400)
            .then(res => {
              assert(res.body.message, ['e164Number must be a valid phone number'])
            })
        })
      })
    })
  })
})
