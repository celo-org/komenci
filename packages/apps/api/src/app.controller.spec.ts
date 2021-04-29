import httpMocks from 'node-mocks-http'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { ThrottlerModule } from '@nestjs/throttler'
import { ContractKit } from '@celo/contractkit'
import { KomenciLoggerService } from '@komenci/logger'
import { networkConfig } from '@komenci/core'
import { appConfig } from './config/app.config'
import { quotaConfig } from './config/quota.config'
import { Session } from './session/session.entity'
import { SubsidyService } from './subsidy/subsidy.service'
import { TxParserService } from './wallet/tx-parser.service'
import { WalletService } from './wallet/wallet.service'
import { RelayerProxyService } from './relayer/relayer_proxy.service'
import { AppController } from './app.controller'
import { AuthService } from './auth/auth.service'
import { DeviceType, StartSessionDto } from './dto/StartSessionDto'
import { GatewayService } from './gateway/gateway.service'
import { SessionService } from './session/session.service'

jest.mock('./gateway/gateway.service')
jest.mock('./relayer/relayer_proxy.service')
jest.mock('./session/session.service')
jest.mock('./wallet/wallet.service')
jest.mock('./subsidy/subsidy.service')
jest.mock('@celo/contractkit')
jest.mock('@komenci/logger/dist/komenci-logger.service')

describe('AppController', () => {
  let appController: AppController
  let jwtService: JwtService
  let gatewayService: GatewayService
  let sessionService: SessionService


  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          ttl: 20,
          limit: 5
        }),
        JwtModule.register({
          secret: 'test-secret'
        })
      ],
      controllers: [AppController],
      providers: [
        RelayerProxyService,
        AuthService,
        GatewayService,
        SessionService,
        WalletService,
        SubsidyService,
        ContractKit,
        TxParserService,
        KomenciLoggerService,
        {
          provide: appConfig.KEY,
          useValue: appConfig.call(null)
        },
        {
          provide: quotaConfig.KEY,
          useValue: quotaConfig.call(null)
        },
        {
          provide: networkConfig.KEY,
          useValue: {}
        },
      ]
    }).compile()

    appController = await app.resolve(AppController)
    jwtService = app.get(JwtService)
    gatewayService = app.get(GatewayService)
    sessionService = app.get(SessionService)
  })

  it('should be defined', () => {
    expect(appController).toBeDefined()
  })

  describe('#startSession', () => {
    let req: httpMocks.MockRequest<any>
    let payload: StartSessionDto
    const externalAccount = "0x1234"

    beforeEach(async () => {
      req = httpMocks.createRequest({})
      payload = {
        captchaResponseToken: "sda",
        deviceType: DeviceType.iOS,
        iosDeviceToken: "asdas",
        externalAccount,
        signature: "0x0"
      }
    })

    describe('when the request passes the gateway', () => {
      it('returns a session token', async () => {
        const gatewayVerify = jest.spyOn(gatewayService, 'verify').mockResolvedValue(true)
        const session = Session.of({id: 'test-session'})
        const sessionFindOrCreate = jest.spyOn(sessionService, 'findOrCreateForAccount').mockResolvedValue(session)

        const result = await appController.startSession(payload, req)

        expect(gatewayVerify).toHaveBeenCalledWith(payload, req)
        expect(sessionFindOrCreate).toHaveBeenCalledWith(payload.externalAccount)
        expect(jwtService.verify(result.token)).toBeTruthy()
        expect(jwtService.decode(result.token)).toMatchObject({sessionId: session.id})
        expect(result.callbackUrl).toBe('http://localhost:3000')
      })
    })

    describe('when the requests fails the gateway', () => {
      it('throws Unauthorized', async () => {
        const gatewayVerify = jest.spyOn(gatewayService, 'verify').mockResolvedValue(false)
        await expect(appController.startSession(payload, req)).rejects.toThrow(/Unauthorized/)
      })
    })
  })
})
