import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import{ Session, SessionRepositoryFake } from './session.entity'
import { SessionService } from './session.service'


describe('SessionService', () => {
  let service: SessionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule(
   {
      providers: [SessionService,
        {
          provide: getRepositoryToken(Session),
          useValue: SessionRepositoryFake,
        },
      ]
  }).compile()

    service = module.get<SessionService>(SessionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create a session object', async () => {
    const session = Session.of({externalAccount:'test', id: '1'})

    jest.spyOn(service, 'createSession').mockResolvedValue(session)

    expect(await service.createSession('test')).toBe(session)

    jest.spyOn(service, 'findOne').mockResolvedValue(session)

    expect(await service.findOne(session.id)).toBe(session)

    jest.spyOn(service, 'findAll').mockResolvedValue([session])

    expect((await service.findAll()).length).toBe(1)

  })

})
