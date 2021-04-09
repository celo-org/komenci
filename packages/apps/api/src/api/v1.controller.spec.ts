import { ContractKit } from '@celo/contractkit'
import { networkConfig } from '@komenci/core'
import { KomenciLoggerService } from '@komenci/logger'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { ThrottlerModule } from '@nestjs/throttler'
import httpMocks from 'node-mocks-http'
import { AuthService } from '../auth/auth.service'
import { appConfig } from '../config/app.config'
import { quotaConfig } from '../config/quota.config'
import { DeviceType, StartSessionDto } from '../dto/StartSessionDto'
import { GatewayService } from '../gateway/gateway.service'
import { RelayerProxyService } from '../relayer/relayer_proxy.service'
import { Session } from '../session/session.entity'
import { SessionService } from '../session/session.service'
import { SubsidyService } from '../subsidy/subsidy.service'
import { TxParserService } from '../wallet/tx-parser.service'
import { WalletService } from '../wallet/wallet.service'
import { V1AppController } from './v1.controller'

jest.mock('../gateway/gateway.service')
jest.mock('../relayer/relayer_proxy.service')
jest.mock('../session/session.service')
jest.mock('../wallet/wallet.service')
jest.mock('../subsidy/subsidy.service')
jest.mock('@celo/contractkit')
jest.mock('@komenci/logger/dist/komenci-logger.service')

describe('V1AppController', () => {
  let appController: V1AppController
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
      controllers: [V1AppController],
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

    appController = await app.resolve(V1AppController)
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
