import { BlockchainModule } from '@app/blockchain'
import { WEB3_PROVIDER } from '@app/blockchain/blockchain.providers'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { KomenciLoggerModule } from '@app/komenci-logger'
import { buildMockWeb3Provider } from '@app/onboarding/utils/testing/mock-web3-provider'
import { ContractKit } from '@celo/contractkit'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { NotifiedBlock } from '../blocks/notifiedBlock.entity'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { EventService } from '../event/eventService.service'
import { partialEventLog } from '../utils/testing'
import { Attestation } from './attestation.entity'
import { AttestationRepository } from './attestation.repository'
import { AttestationService } from './attestation.service'

const account1 = '0x001'
const account2 = '0x002'
const identifier1 = '0x003'
const identifier2 = '0x004'

describe('InviteRewardService', () => {
  let service: AttestationService
  let repository: AttestationRepository
  let notifiedBlockRepository: NotifiedBlockRepository
  let contractKit: ContractKit
  let attestations: AttestationsWrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BlockchainModule.forRootAsync({
          useFactory: () => {
            return {
              node: {
                providerType: NodeProviderType.HTTP,
                url: 'not-a-node'
              }
            }
          }
        }),
        KomenciLoggerModule.forRoot()
      ],
      providers: [
        AttestationService,
        NotifiedBlockService,
        EventService,
        {
          provide: getRepositoryToken(Attestation),
          useClass: Repository
        },
        {
          provide: getRepositoryToken(NotifiedBlock),
          useClass: Repository
        }
      ]
    })
      .overrideProvider(WEB3_PROVIDER)
      .useValue(buildMockWeb3Provider(() => null))
      .compile()

    repository = module.get<Repository<Attestation>>(
      getRepositoryToken(Attestation)
    )
    notifiedBlockRepository = module.get<Repository<NotifiedBlock>>(
      getRepositoryToken(NotifiedBlockRepository)
    )
    service = module.get<AttestationService>(AttestationService)
    contractKit = module.get(ContractKit)
    attestations = await contractKit.contracts.getAttestations()

    jest
      .spyOn(contractKit.web3.eth, 'getBlockNumber')
      .mockImplementation(() => Promise.resolve(20))
  })

  interface AttestationEventMetadata {
    blockNumber: number
    identifier: string
    address: string
  }

  const mockAttestationEvents = (
    events: AttestationEventMetadata[]
  ): jest.SpyInstance => {
    return jest.spyOn(attestations, 'getPastEvents').mockImplementation(() =>
      Promise.resolve(
        events.map(metadata =>
          partialEventLog({
            blockNumber: metadata.blockNumber,
            returnValues: {
              identifier: metadata.identifier,
              account: metadata.address,
              issuer: '0xsome_issuer'
            }
          })
        )
      )
    )
  }

  const mockFindBlock = (id: string, blockNumber: number) => {
    jest.spyOn(notifiedBlockRepository, 'findOne').mockImplementation(() =>
      Promise.resolve({
        id,
        key: 'attestation',
        blockNumber
      })
    )
  }

  describe('#fetchAttestations', () => {
    const updateBlockMock = jest.fn()
    const saveAttestationMock = jest.fn()
    let notifiedBlockId

    beforeEach(() => {
      notifiedBlockId = uuidv4()
      mockFindBlock(notifiedBlockId, 10)
      notifiedBlockRepository.update = updateBlockMock
      mockAttestationEvents([
        {
          address: account1,
          identifier: identifier1,
          blockNumber: 18
        },
        {
          address: account2,
          identifier: identifier2,
          blockNumber: 20
        }
      ])
      repository.save = saveAttestationMock
    })

    describe('when a new attestation is found', () => {
      it('stores it', async () => {
        await service.fetchAttestations()

        expect(saveAttestationMock).toHaveBeenCalledWith(
          expect.objectContaining({
            address: account1,
            identifier: identifier1
          })
        )
        expect(saveAttestationMock).toHaveBeenCalledWith(
          expect.objectContaining({
            address: account2,
            identifier: identifier2
          })
        )
        expect(updateBlockMock).toHaveBeenCalledWith(
          expect.objectContaining({
            id: notifiedBlockId,
            key: 'attestation'
          }),
          { blockNumber: 20 }
        )
      })
    })
  })
})
