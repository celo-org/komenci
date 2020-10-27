import { appConfig } from '@app/onboarding/config/app.config'
import { Session } from '@app/onboarding/session/session.entity'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { WalletService } from '@app/onboarding/wallet/wallet.service'
import { ContractKit } from '@celo/contractkit'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import httpMocks from 'node-mocks-http'
import { AppController } from './app.controller'
import { AuthService } from './auth/auth.service'
import { DeviceType, StartSessionDto } from './dto/StartSessionDto'
import { GatewayService } from './gateway/gateway.service'
import { RelayerProxyService } from './relayer_proxy.service'
import { SessionService } from './session/session.service'

jest.mock('./gateway/gateway.service')
jest.mock('./relayer_proxy.service')
jest.mock('./session/session.service')
jest.mock('./wallet/wallet.service')
jest.mock('./subsidy/subsidy.service')
jest.mock('@celo/contractkit')

describe('AppController', () => {
  let appController: AppController
  let jwtService: JwtService
  let gatewayService: GatewayService
  let sessionService: SessionService


  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
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
        {
          provide: appConfig.KEY,
          useValue: appConfig.call(null)
        }
      ]
    }).compile()

    appController = app.get(AppController)
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
      })
    })

    describe('when the requests fails the gateway', () => {
      it('throws Forbidden', async () => {
        const gatewayVerify = jest.spyOn(gatewayService, 'verify').mockResolvedValue(false)
        await expect(appController.startSession(payload, req)).rejects.toThrow(/Forbidden/)
      })
    })
  })
})
