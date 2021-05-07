import { ensureLeading0x, trimLeading0x } from '@celo/base/lib'
import { Err, Ok } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { LocalWallet } from '@celo/wallet-local'
import { buildLoginTypedData } from '@komenci/kit/lib/login'
import { ValidationPipe } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { assert } from 'console'
import { isRight } from 'fp-ts/Either'
import _ from 'lodash'
import { Connection, EntityManager, Repository } from 'typeorm'
import Web3 from 'web3'
import { AppModule } from '../src/app.module'
import { AuthService, TokenPayload } from '../src/auth/auth.service'
import { RulesConfig, rulesConfig } from '../src/config/rules.config'
import { throttleConfig, ThrottleConfig } from '../src/config/throttle.config'
import { DeployWalletDto } from '../src/dto/DeployWalletDto'
import { StartSessionDto } from '../src/dto/StartSessionDto'
import { CaptchaService, CaptchaVerificationFailed } from '../src/gateway/captcha/captcha.service'
import { DeviceCheckService } from '../src/gateway/device-check/device-check.service'
import { RuleID } from '../src/gateway/rules/rule'
import { SafetyNetService } from '../src/gateway/safety-net/safety-net.service'
import { RelayerProxyService } from '../src/relayer/relayer_proxy.service'
import { Session } from '../src/session/session.entity'
import { SessionService } from '../src/session/session.service'
const request = require('supertest')

jest.mock('../src/gateway/captcha/captcha.service')
jest.mock('../src/gateway/device-check/device-check.service')
jest.mock('../src/gateway/safety-net/safety-net.service')
jest.mock('../src/relayer/relayer_proxy.service.ts')

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
  let relayerProxyService: RelayerProxyService
  let app

  let rulesConfigValue: RulesConfig
  let throttleConfigValue: ThrottleConfig

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).overrideProvider(rulesConfig.KEY).useValue(rulesConfigValue)
      .overrideProvider(throttleConfig.KEY).useValue(throttleConfigValue)
      .compile()


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
    relayerProxyService = module.get(RelayerProxyService)
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
    jest.spyOn(relayerProxyService, 'getPhoneNumberIdentifier').mockResolvedValue(
      Ok({
        payload: "abcd1234",
        relayerAddress: "0x0"
      })
    )
  })

  throttleConfigValue = {
    ttl: 20,
    limit: 100,
  }

  rulesConfigValue = {
    enabled: {
      [RuleID.DailyCap]: false,
      [RuleID.DeviceAttestation]: false,
      [RuleID.Captcha]: true,
      [RuleID.Signature]: true,
    },
    configs: {
      [RuleID.DailyCap]: null,
      [RuleID.Captcha]: {
        bypassEnabled: false,
        bypassToken: ""
      },
      [RuleID.DeviceAttestation]: null,
      [RuleID.Signature]: null
    },
  }

  describe('/v1/ (GET) ready', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('returns ok until the rate limit is met', async () => {
      const server = app.getHttpServer()
      const captchaToken = "captcha-token"
      const wallet = new LocalWallet()
      const privateKey = trimLeading0x(Web3.utils.randomHex(32))
      wallet.addAccount(privateKey)
      const eoa = ensureLeading0x(wallet.getAccounts()[0])
      const signature = await wallet.signTypedData(eoa, buildLoginTypedData(eoa, captchaToken))
      jest.spyOn(
        captchaService, 'verifyCaptcha'
      ).mockResolvedValue(Ok(true))
      const startSessionPayload = {
        externalAccount: eoa,
        captchaResponseToken: captchaToken,
        signature
      }

      await Promise.all(_.times(100).map(async () => {
        const readyResp = await request(server).get('/v1/ready')
        expect(readyResp.statusCode).toBe(200)
        expect(readyResp.body.status).toBe('Ready')
        await request(app.getHttpServer()).post('/v1/startSession').send(startSessionPayload)
      }))

      const nextResp = await request(server).get('/v1/ready')
      expect(nextResp.statusCode).toBe(429)
      jest.advanceTimersByTime(20000)
      const okResp = await request(server).get('/v1/ready')
      expect(okResp.statusCode).toBe(200)
    })
  })

  describe('/v1/ (POST) startSession', () => {
    const decodeToken = (token: string): TokenPayload => {
      const decodeResp = TokenPayload.decode(jwtService.verify(token))
      expect(isRight(decodeResp)).toBe(true)
      // @ts-ignore - we're expecting
      return decodeResp.right
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

        it('returns a 401', async () => {
          const payload: StartSessionDto = {
            externalAccount: eoa,
            captchaResponseToken: captchaToken,
            signature
          }

          const resp = await request(app.getHttpServer()).post('/v1/startSession').send(payload)
          expect(resp.statusCode).toEqual(401)
          expect(resp.body).toMatchObject({
            statusCode: 401,
            message: 'Unauthorized'
          })
        })
      })

      describe("but an invalid captcha token", () => {
        beforeEach(async () => {
          const wallet = new LocalWallet()
          wallet.addAccount(privateKey)
          eoa = ensureLeading0x(wallet.getAccounts()[0])
          signature = await wallet.signTypedData(eoa, buildLoginTypedData(eoa, captchaToken))
          verifyCaptchaSpy = jest.spyOn(
            captchaService, 'verifyCaptcha'
          ).mockResolvedValue(Err(new CaptchaVerificationFailed([], "")))
        })

        it('returns a 401', async () => {
          const payload: StartSessionDto = {
            externalAccount: eoa,
            captchaResponseToken: captchaToken,
            signature
          }

          const resp = await request(app.getHttpServer()).post('/v1/startSession').send(payload)
          expect(resp.statusCode).toEqual(401)
          expect(resp.body).toMatchObject({
            statusCode: 401,
            message: 'Unauthorized'
          })
        })
      })

      describe('and a valid captcha and signature', () => {
        beforeEach(async () => {
          const wallet = new LocalWallet()
          wallet.addAccount(privateKey)
          eoa = ensureLeading0x(wallet.getAccounts()[0])
          signature = await wallet.signTypedData(eoa, buildLoginTypedData(eoa, captchaToken))
          verifyCaptchaSpy = jest.spyOn(
            captchaService, 'verifyCaptcha'
          ).mockResolvedValue(Ok(true))
        })

        const subject = async () => {
          const payload = {
            externalAccount: eoa,
            captchaResponseToken: captchaToken,
            signature
          }

          return request(app.getHttpServer()).post('/v1/startSession').send(payload)
        }

        describe("when no session exist for the account", () => {
          it('creates a new session and returns the id in a token', async () => {
            const save = jest.spyOn(sessionRepository, 'save')
            const resp = await subject()
            const tokenPayload = decodeToken(resp.body.token)

            expect(save).toHaveBeenCalled()
            const session = await sessionRepository.findOne(tokenPayload.sessionId)
            expect(session).toBeDefined()
            expect(ensureLeading0x(session.externalAccount)).toEqual(eoa)
          })
        })

        describe("when a session already exists", () => {
          describe("but it finished one action quota", () => {
            it("creates a new session and returns the id in a token", async() => {
              const oldSess = await sessionService.create(eoa)
              oldSess.meta = {
                callCount: {
                  distributedBlindedPepper: 1
                }
              }
              await sessionRepository.save(oldSess)

              const save = jest.spyOn(sessionRepository, 'save')
              const resp = await subject()
              const tokenPayload = decodeToken(resp.body.token)

              expect(save).toHaveBeenCalled()
              const session = await sessionRepository.findOne(tokenPayload.sessionId)
              expect(session).toBeDefined()
              expect(ensureLeading0x(session.externalAccount)).toEqual(eoa)
              expect(await sessionRepository.count()).toEqual(2)
            })
          })

          describe("and it's open", () => {
            it("reuses the same session", async () => {
              const oldSess = await sessionService.create(eoa)
              await sessionRepository.save(oldSess)

              const save = jest.spyOn(sessionRepository, 'save')
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

  describe('/v1/ (POST) deployWallet', () => {
    let token: string = ""

    const eoa = Web3.utils.randomHex(20)
    const impl = Web3.utils.randomHex(20)

    beforeEach(async () => {
      token = (await authService.startSession(eoa)).token
    })

    describe('with an invalid implementation', () => {
      it('returns a 400:InvalidImplementation', async () => {
        const payload: DeployWalletDto = {
          implementationAddress: impl
        }
        const resp = await request(app.getHttpServer())
          .post('/v1/deployWallet')
          .auth(token, {type: 'bearer'})
          .send(payload)

        expect(resp.status).toBe(400)
        expect(resp.body).toMatchObject({
          errorType: 'InvalidImplementation'
        })
      })
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
        token = (await authService.startSession(eoa)).token
      })

      describe('with an invalid payload', () => {
        it('Returns 400 with empty body', async () => {
          const resp = await request(app.getHttpServer())
            .post('/v1/distributedBlindedPepper')
            .set('Authorization', `Bearer ${token}`)
          expect(resp.statusCode).toBe(400)
        })

        it('Returns 400 with invalid blindedPhoneNumber', async () => {
          return request(app.getHttpServer())
            .post('/v1/distributedBlindedPepper')
            .set('Authorization', `Bearer ${token}`)
            .send({
              blindedPhoneNumber: 'invalid base64'
            })
            .expect(400)
            .then(res => {
              assert(res.body.message, 'blindedPhoneNumber must be a valid base64 string')
            })
        })
      })

      describe('with an valid payload', () => {
        it('Returns 200', async () => {
          return request(app.getHttpServer())
            .post('/v1/distributedBlindedPepper')
            .set('Authorization', `Bearer ${token}`)
            .send({
              blindedPhoneNumber: Buffer.from('+34600000000').toString('base64')
            })
            .expect(201)
            .then(res => {
              assert(res.body.message, 'blindedPhoneNumber must be a valid base64 string')
            })
        })

        it('Returns 429 when quota is exceeded', async () => {
          const response = await authService.startSession(eoa)
          const doRequest = () => 
            request(app.getHttpServer())
              .post('/v1/distributedBlindedPepper')
              .set('Authorization', `Bearer ${response.token}`)
              .send({
                blindedPhoneNumber: Buffer.from('+34600000000').toString('base64')
              })

          await doRequest().expect(201)
          await doRequest().expect(429)
            .then(res => {
              expect(res.body.message).toMatch(
                /Quota exceeded on distributedBlindedPepper/
              )
            })
        })
      })
    })
  })
})
