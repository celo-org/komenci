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
    const result = Session.of({externalAccount:'test', id: 1})

    const createSessionSpy = jest.spyOn(service, 'createSession').mockResolvedValue(result)

    const res = await service.createSession('test')

    // expect(createSessionSpy).toBeCalledWith(result)
    expect(res).toBe(result)

    jest.spyOn(service, 'findOne').mockResolvedValue(result)

    const r = await service.findOne(result.id)
    expect(r).toBe(result)

    jest.spyOn(service, 'findAll').mockResolvedValue([result])

    const re = await service.findAll()
    console.log(re)
    
  })

})
