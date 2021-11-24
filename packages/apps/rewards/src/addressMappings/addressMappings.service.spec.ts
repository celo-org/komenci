import { ContractKit } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { AnalyticsService } from '@komenci/analytics'
import { BlockchainModule } from '@komenci/blockchain'
import { WEB3_PROVIDER } from '@komenci/blockchain/dist/blockchain.providers'
import { NodeProviderType } from '@komenci/blockchain/dist/config/node.config'
import { buildMockWeb3Provider } from '@komenci/core'
import { KomenciLoggerModule } from '@komenci/logger'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { NotifiedBlock } from '../blocks/notifiedBlock.entity'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { appConfig } from '../config/app.config'
import { EventService } from '../event/eventService.service'
import { partialEventLog } from '../utils/testing'
import { AddressMappings } from './addressMappings.entity'
import { AddressMappingsRepository } from './addressMappings.repository'
import { AddressMappingsService } from './addressMappings.service'

const accountAddress1 = '0x001'
const accountAddress2 = '0x002'
const walletAddress1 = '0x101'
const walletAddress2 = '0x102'

describe('AddressMappingsService', () => {
  let service: AddressMappingsService
  let repository: AddressMappingsRepository
  let notifiedBlockRepository: NotifiedBlockRepository
  let contractKit: ContractKit
  let accounts: AccountsWrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BlockchainModule.forRootAsync({
          useFactory: () => {
            return {
              node: {
                providerType: NodeProviderType.HTTP,
                url: 'not-a-node',
                nodeApiKey: '',
              }
            }
          }
        }),
        KomenciLoggerModule.forRoot()
      ],
      providers: [
        AddressMappingsService,
        NotifiedBlockService,
        EventService,
        AnalyticsService,
        {
          provide: getRepositoryToken(AddressMappings),
          useFactory: () => new AddressMappingsRepository()
        },
        {
          provide: getRepositoryToken(NotifiedBlock),
          useClass: Repository
        },
        {
          provide: appConfig.KEY,
          useValue: {}
        }
      ]
    })
      .overrideProvider(WEB3_PROVIDER)
      .useValue(buildMockWeb3Provider(() => null))
      .compile()

    repository = module.get<AddressMappingsRepository>(
      AddressMappingsRepository
    )
    notifiedBlockRepository = module.get<Repository<NotifiedBlock>>(
      getRepositoryToken(NotifiedBlockRepository)
    )
    service = module.get<AddressMappingsService>(AddressMappingsService)
    contractKit = module.get(ContractKit)
    accounts = await contractKit.contracts.getAccounts()

    jest
      .spyOn(contractKit.web3.eth, 'getBlockNumber')
      .mockImplementation(() => Promise.resolve(20))
  })

  interface AccountWalletAddressSetEventMetadata {
    blockNumber: number
    accountAddress: string
    walletAddress: string
  }

  const mockAddressMappingEvents = (
    events: AccountWalletAddressSetEventMetadata[]
  ): jest.SpyInstance => {
    return jest.spyOn(accounts, 'getPastEvents').mockImplementation(() =>
      Promise.resolve(
        events.map((metadata) =>
          partialEventLog({
            blockNumber: metadata.blockNumber,
            returnValues: {
              account: metadata.accountAddress,
              walletAddress: metadata.walletAddress
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
        key: 'addressMappings',
        blockNumber
      })
    )
  }

  describe('#fetchAddressMappings', () => {
    const updateBlockMock = jest.fn()
    const saveAddressMappingMock = jest.fn()
    let notifiedBlockId

    beforeEach(() => {
      notifiedBlockId = uuidv4()
      mockFindBlock(notifiedBlockId, 10)
      notifiedBlockRepository.update = updateBlockMock
      mockAddressMappingEvents([
        {
          accountAddress: accountAddress1,
          walletAddress: walletAddress1,
          blockNumber: 18
        },
        {
          accountAddress: accountAddress2,
          walletAddress: walletAddress2,
          blockNumber: 20
        }
      ])
      repository.save = saveAddressMappingMock
    })

    describe('when a new address mapping is found', () => {
      it('stores it', async () => {
        await service.fetchAddressMappings()

        expect(saveAddressMappingMock).toHaveBeenCalledWith(
          expect.objectContaining({
            accountAddress: accountAddress1,
            walletAddress: walletAddress1
          })
        )
        expect(saveAddressMappingMock).toHaveBeenCalledWith(
          expect.objectContaining({
            accountAddress: accountAddress2,
            walletAddress: walletAddress2
          })
        )
        expect(updateBlockMock).toHaveBeenCalledWith(
          expect.objectContaining({
            id: notifiedBlockId,
            key: 'addressMappings'
          }),
          { blockNumber: 20 }
        )
      })
    })
  })
})
