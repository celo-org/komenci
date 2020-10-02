import { Session } from '@app/onboarding/session/session.entity'
import { Post } from '@nestjs/common'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import httpMocks from 'node-mocks-http'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthService } from './auth/auth.service'
import { DeviceType, StartSessionDto } from './dto/StartSessionDto'
import { GatewayService } from './gateway/gateway.service'
import { RelayerProxyService } from './relayer_proxy.service'
import { SessionService } from './session/session.service'

jest.mock('./gateway/gateway.service')
jest.mock('./relayer_proxy.service')
jest.mock('./session/session.service')

describe('AppController', () => {
  let appController: AppController
  // @ts-ignore
  const gatewayService: GatewayService = new GatewayService()
  // @ts-ignore
  const sessionService = new SessionService()
  // @ts-ignore
  const relayerService = new RelayerProxyService()
  let jwtService: JwtService


  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret'
        })
      ],
      controllers: [AppController],
      providers: [
        AppService, RelayerProxyService,
        AuthService, GatewayService, SessionService
      ]
    }).overrideProvider(GatewayService).useValue(gatewayService)
      .overrideProvider(RelayerProxyService).useValue(relayerService)
      .overrideProvider(SessionService).useValue(sessionService)
      .compile()

    appController = app.get<AppController>(AppController)
    jwtService = app.get<JwtService>(JwtService)
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
