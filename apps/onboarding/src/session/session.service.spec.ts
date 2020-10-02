import { ensureLeading0x, normalizeAddress } from '@celo/base'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Web3 from 'web3'
import{ Session } from './session.entity'
import { SessionRepository } from './session.repository'
import { SessionService } from './session.service'


describe('SessionService', () => {
  let service: SessionService
  let repository: SessionRepository

  beforeEach(async () => {
    jest.clearAllMocks()
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

  describe('#createSession', () => {
    let session: Session
    let save: jest.SpyInstance
    let eoa: string

    beforeEach(async () => {
      eoa = ensureLeading0x(Web3.utils.randomHex(20).toLocaleLowerCase())
      save = jest.spyOn(repository, 'save').mockImplementation(
        (s: Session) => Promise.resolve(s)
      )
      session = await service.createSession(eoa)
    })

    it('creates a new session for an external account', async () => {
      expect(save).toHaveBeenCalled()
      expect(session).toBeDefined()
    })

    it('normalizes the address', () => {
      expect(session.externalAccount).not.toEqual(eoa)
      expect(session.externalAccount).toEqual(normalizeAddress(eoa))
    })
  })

  describe('#findOne', () => {
    let findOne: jest.SpyInstance
    beforeEach(async () => {
      const session = new Session()
      findOne = jest.spyOn(repository, 'findOne').mockImplementation(
        () => Promise.resolve(session)
      )
    })

    it('delegates to the repository', async () => {
      const session = await service.findOne('an-id')
      expect(findOne).toBeCalledWith('an-id')
    })
  })

  describe('#findLastForAccount', () => {
    let findOne: jest.SpyInstance
    beforeEach(async () => {
      const session = new Session()
      findOne = jest.spyOn(repository, 'findOne').mockImplementation(
        () => Promise.resolve(session)
      )
    })

    it('delegates to the repository', async () => {
      const session = await service.findLastForAccount('an-account')
      expect(findOne).toBeCalledWith(
        {externalAccount: 'an-account'},
        {order: {createdAt: 'DESC'}}
      )
    })
  })

  describe('#findOrCreateForAccount', () => {
    const eoa = `0x${Web3.utils.randomHex(20)}`
    let findOne: jest.SpyInstance
    let save: jest.SpyInstance

    const mockFindOne = (result: Session | undefined): jest.SpyInstance => {
      return jest.spyOn(repository, 'findOne').mockImplementation(
        () => Promise.resolve(result)
      )
    }

    beforeEach(() => {
      save = jest.spyOn(repository, 'save').mockImplementation(
        (s: Session) => Promise.resolve(s)
      )
    })

    describe('when no session exists', () => {
      beforeEach(() => {
        findOne = mockFindOne(undefined)
      })

      it('creates it ', async () => {
        const session = await service.findOrCreateForAccount(eoa)
        expect(save).toHaveBeenCalled()
      })
    })

    describe('when a session exists', () => {
      const existingId = 'existing-session-id'
      describe('but it is expired', () => {
        beforeEach(() => {
          findOne = mockFindOne(Session.of({
            id: existingId,
            expiredAt: new Date(Date.now()).toISOString(),
          }))
        })

        it('creates a new one', async () => {
          const session = await service.findOrCreateForAccount(eoa)
          expect(save).toHaveBeenCalled()
          expect(session.id).not.toEqual(existingId)
        })
      })

      describe('but it is completed', () => {
        beforeEach(() => {
          findOne = mockFindOne(Session.of({
            id: existingId,
            completedAt: new Date(Date.now()).toISOString(),
          }))
        })

        it('creates a new one', async () => {
          const session = await service.findOrCreateForAccount(eoa)
          expect(save).toHaveBeenCalled()
          expect(session.id).not.toEqual(existingId)
        })
      })

      describe('and is still open', () => {
        beforeEach(() => {
          findOne = mockFindOne(Session.of({
            id: existingId,
          }))
        })

        it('returns it', async () => {
          const session = await service.findOrCreateForAccount(eoa)
          expect(save).not.toHaveBeenCalled()
          expect(session.id).toEqual(existingId)
        })
      })
    })
  })
})
