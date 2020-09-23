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

    const createSessionSpy = jest.spyOn(service, 'createSession').mockResolvedValue(session)

    const res = await service.createSession('test')

    expect(res).toBe(session)

    jest.spyOn(service, 'findOne').mockResolvedValue(session)

    const r = await service.findOne(session.id)
    expect(r).toBe(session)

    jest.spyOn(service, 'findAll').mockResolvedValue([session])

    const re = await service.findAll()
    expect(re.length).toBe(1)

  })

})
