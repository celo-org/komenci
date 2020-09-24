import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import{ Session } from './session.entity'
import { SessionRepository } from './session.repository'
import { SessionService } from './session.service'


describe('SessionService', () => {
  let service: SessionService
  let repository: SessionRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionService,
        {
          provide: getRepositoryToken(Session),
          useClass: Repository,
        },
      ]
    }).compile()

    repository = module.get<Repository<Session>>(getRepositoryToken(Session))
    service = module.get<SessionService>(SessionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return for create', async () => {
    const session = Session.of({externalAccount:'test', id: '1'})

    jest.spyOn(repository, 'save').mockResolvedValue(session)

    expect(await service.createSession('test')).toEqual(session)

  })

  it('should return for findAll', async () => {
    const session = Session.of({externalAccount:'test', id: '1'})

    jest.spyOn(repository, 'find').mockResolvedValueOnce([session])

    expect(await service.findAll()).toEqual([session])

  })

  it('should return for findOne', async () => {
    const session = Session.of({externalAccount:'test', id: '1'})

    jest.spyOn(repository, 'findOne').mockResolvedValueOnce(session)

    expect(await service.findOne('1')).toEqual(session)

  })

  it('should return for removeSession', async () => {
    jest.spyOn(repository, 'delete').mockResolvedValue(null)

    expect(await service.removeSession('1')).toBe(null)

  })
  

})
