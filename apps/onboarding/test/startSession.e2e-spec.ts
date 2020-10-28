import { AuthService } from '@app/onboarding/auth/auth.service'
import { rulesConfig, RulesConfig } from '@app/onboarding/config/rules.config'
import { StartSessionDto } from '@app/onboarding/dto/StartSessionDto'
import { CaptchaService } from '@app/onboarding/gateway/captcha/captcha.service'
import { DeviceCheckService } from '@app/onboarding/gateway/device-check/device-check.service'
import { RuleID } from '@app/onboarding/gateway/rules/rule'
import { SafetyNetService } from '@app/onboarding/gateway/safety-net/safety-net.service'
import { Session } from '@app/onboarding/session/session.entity'
import { SessionService } from '@app/onboarding/session/session.service'
import { serializeSignature } from '@celo/base'
import { ensureLeading0x, trimLeading0x } from '@celo/base/lib'
import { Ok } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet'
import { buildLoginTypedData } from '@celo/komencikit/lib/login'
import { hashMessage } from '@celo/utils/lib/signatureUtils'
import { ValidationPipe } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { assert } from 'console'
import { isRight } from 'fp-ts/Either'
import { Connection, EntityManager, Repository } from 'typeorm'
import Web3 from 'web3'
import { AppModule } from '../src/app.module'
const request = require('supertest')

jest.mock('@app/onboarding/gateway/captcha/captcha.service')
jest.mock('@app/onboarding/gateway/device-check/device-check.service')
jest.mock('@app/onboarding/gateway/safety-net/safety-net.service')

describe('AppController (e2e)', () => {
  let safetyNetService: SafetyNetService
  let captchaService: CaptchaService
  let deviceCheckService: DeviceCheckService
  let sessionService: SessionService
  let contractKit: ContractKit
  let sessionRepository: Repository<Session>
  let authService: AuthService
  let jwtService: JwtService
  let manager: EntityManager
  let dbConn: Connection
  let app

  let rulesConfigValue: RulesConfig


  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).overrideProvider(rulesConfig.KEY).useValue(rulesConfigValue).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe())
    await app.init()

    safetyNetService = module.get(SafetyNetService)
    captchaService = module.get(CaptchaService)
    deviceCheckService = module.get(DeviceCheckService)
    sessionService = module.get(SessionService)
    contractKit = module.get(ContractKit)
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session))
    jwtService = module.get(JwtService)
    dbConn = module.get(Connection)
    manager = module.get(EntityManager)
    authService = module.get(AuthService)
    // @ts-ignore
    manager.queryRunner = dbConn.createQueryRunner("master") // tslint:disable-line
    await manager.queryRunner.clearTable("session")

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

  rulesConfigValue = {
    enabled: {
      [RuleID.DailyCap]: false,
      [RuleID.DeviceAttestation]: false,
      [RuleID.Captcha]: true,
      [RuleID.Signature]: true,
    },
    configs: {
      [RuleID.DailyCap]: "{}",
      [RuleID.Captcha]: "{}",
      [RuleID.DeviceAttestation]: "{}",
      [RuleID.Signature]: "{}",
    },
  }

  describe.only('/v1/ (POST) startSession', () => {
    const loginSignature = async (eoa: string, captchaToken: string): Promise<string> => {
      return serializeSignature(
        await contractKit.signTypedData(eoa, buildLoginTypedData(eoa, captchaToken))
      )

    }

    describe('with invalid payloads', () => {
      it('Returns 400 with empty body', async () => {
        const resp = await request(app.getHttpServer()).post('/v1/startSession')
        expect(resp.statusCode).toBe(400)
      })

      it('Returns 400 with an invalid body', async () => {
        const resp = await request(app.getHttpServer()).post('/v1/startSession').send({
          notThatRight: 'payload'
        })
        expect(resp.statusCode).toBe(400)
      })

      it('Returns 400 with an invalid ethereum address', async () => {
        const payload: StartSessionDto = {
          externalAccount: "not-a-valid-address",
          captchaResponseToken: "captcha-token",
          signature: "0x0"
        }
        const resp = await request(app.getHttpServer()).post('/v1/startSession').send(payload)
        expect(resp.statusCode).toBe(400)
        expect(resp.body.message[0]).toMatch(/must be a valid Celo address/)
      })

      it('Returns 400 with an invalid signature', async () => {
        const payload: StartSessionDto = {
          externalAccount: Web3.utils.randomHex(20),
          captchaResponseToken: "captcha-token",
          signature: "not-a-signature"
        }
        const resp = await request(app.getHttpServer()).post('/v1/startSession').send(payload)
        expect(resp.statusCode).toBe(400)
        expect(resp.body.message[0]).toMatch(/signature must be a hexadecimal number/)
      })
    })

    describe("with a valid payload", () => {
      let verifyCaptchaSpy: jest.SpyInstance
      const captchaToken = "captcha-token"
      const privateKey = trimLeading0x(Web3.utils.randomHex(32))
      let eoa: string
      let signature: string

      describe("but an invalid signer on the signature", () => {
        beforeEach(async () => {
          eoa = Web3.utils.randomHex(20)
          const wallet = new LocalWallet()
          wallet.addAccount(privateKey)
          const signer = ensureLeading0x(wallet.getAccounts()[0])
          signature = await wallet.signTypedData(signer, buildLoginTypedData(eoa, captchaToken))
          verifyCaptchaSpy = jest.spyOn(captchaService, 'verifyCaptcha').mockResolvedValue(Ok(true))
        })

        it('returns a 403', async () => {
          const payload: StartSessionDto = {
            externalAccount: eoa,
            captchaResponseToken: captchaToken,
            signature
          }

          const resp = await request(app.getHttpServer()).post('/v1/startSession').send(payload)
          expect(resp.statusCode).toEqual(403)
          expect(resp.body).toMatchObject({
            statusCode: 403,
            message: 'Forbidden'
          })
        })
      })

      // describe("when the gateway does not pass", () => {
      //   it("Returns 403 with an error", async () => {
      //     const payload = startSessionPayload(eoa, signature)
      //     const resp = await request(app.getHttpServer()).post('/v1/startSession').send(payload)
      //     expect(resp.statusCode).toEqual(403)
      //     expect(resp.body).toMatchObject({
      //       statusCode: 403,
      //       message: 'Forbidden'
      //     })
      //   })
      // })

      // describe("when the gateway passes", () => {
      //   const decodeToken = (token: string): TokenPayload => {
      //     const decodeResp = TokenPayload.decode(jwtService.verify(token))
      //     expect(isRight(decodeResp)).toBe(true)
      //     // @ts-ignore - we're expecting
      //     return decodeResp.right
      //   }

      //   const subject = async () => {
      //     const payload = startSessionPayload(eoa, signature)
      //     const resp = await request(app.getHttpServer()).post('/v1/startSession').send(payload)
      //     expect(resp.status).toEqual(201)
      //     return resp
      //   }

      //   describe("when no session exist for the account", () => {
      //     it('creates a new session and returns the id in a token', async () => {
      //       const save = jest.spyOn(sessionRepository, 'save')
      //       const resp = await subject()
      //       const tokenPayload = decodeToken(resp.body.token)

      //       expect(save).toHaveBeenCalled()
      //       const session = await sessionRepository.findOne(tokenPayload.sessionId)
      //       expect(session).toBeDefined()
      //       expect(ensureLeading0x(session.externalAccount)).toEqual(eoa)
      //     })
      //   })

      //   describe("when a session already exists", () => {
      //     describe("but it's closed", () => {
      //       it("creates a new session and returns the id in a token", async() => {
      //         const oldSess = await sessionService.create(eoa)
      //         oldSess.completedAt = new Date(Date.now()).toISOString()
      //         await sessionRepository.save(oldSess)

      //         const save = jest.spyOn(sessionRepository, 'save')
      //         const payload = startSessionPayload(eoa, signature)
      //         const resp = await subject()
      //         const tokenPayload = decodeToken(resp.body.token)

      //         expect(save).toHaveBeenCalled()
      //         const session = await sessionRepository.findOne(tokenPayload.sessionId)
      //         expect(session).toBeDefined()
      //         expect(ensureLeading0x(session.externalAccount)).toEqual(eoa)
      //         expect(await sessionRepository.count()).toEqual(2)
      //       })
      //     })

      //     describe("and it's open", () => {
      //       it("reuses the same session", async () => {
      //         const oldSess = await sessionService.create(eoa)
      //         await sessionRepository.save(oldSess)

      //         const save = jest.spyOn(sessionRepository, 'save')
      //         const payload = startSessionPayload(eoa, signature)
      //         const resp = await subject()
      //         const tokenPayload = decodeToken(resp.body.token)

      //         expect(tokenPayload.sessionId).toEqual(oldSess.id)
      //         expect(await sessionRepository.count()).toEqual(1)
      //       })
      //     })
      //   })
      // })
    })
  })

  describe('/v1/ (POST) distributedBlindedPepper', () => {
    const eoa = Web3.utils.randomHex(20)
    let token: string

    describe('without a token', () => {
      it('Returns 401', async () => {
        return request(app.getHttpServer())
          .post('/v1/distributedBlindedPepper')
          .expect(401)
      })
    })

    describe('with a token', () => {
      beforeEach(async () => {
        token = await authService.startSession(eoa)
      })

      describe('with an invalid payload', () => {
        it('Returns 400 with empty body', async () => {
          const resp = await request(app.getHttpServer())
            .post('/v1/distributedBlindedPepper')
            .set('Authorization', `Bearer ${token}`)
          expect(resp.statusCode).toBe(400)
        })

        it('Returns 400 with invalid phone number', async () => {
          return request(app.getHttpServer())
            .post('/v1/distributedBlindedPepper')
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
