import { BlockchainModule } from '@app/blockchain'
import { WEB3_PROVIDER } from '@app/blockchain/blockchain.providers'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { KomenciLoggerModule } from '@app/komenci-logger'
import { buildMockWeb3Provider } from '@app/onboarding/utils/testing/mock-web3-provider'
import { networkConfig } from '@app/utils/config/network.config'
import { ContractKit } from '@celo/contractkit'
import {
  AttestationStat,
  AttestationsWrapper
} from '@celo/contractkit/lib/wrappers/Attestations'
import { EscrowWrapper } from '@celo/contractkit/lib/wrappers/Escrow'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { NotifiedBlock } from '../blocks/notifiedBlock.entity'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { partialEventLog, partialTransaction } from '../utils/testing'
import { InviteReward, RewardStatus } from './inviteReward.entity'
import { InviteRewardRepository } from './inviteReward.repository'
import { InviteRewardService } from './inviteReward.service'

const inviteeAddress = '0x001'
const inviterAddress = '0x002'
const komenciAddress = '0x003'
const inviteTxHash = '0x004'
const cUsdTokenAddress = '0x005'

describe('InviteRewardService', () => {
  let service: InviteRewardService
  let repository: InviteRewardRepository
  let notifiedBlockRepository: NotifiedBlockRepository
  let contractKit: ContractKit
  let escrow: EscrowWrapper
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
        InviteRewardService,
        {
          provide: getRepositoryToken(InviteReward),
          useClass: Repository
        },
        {
          provide: getRepositoryToken(NotifiedBlock),
          useClass: Repository
        },
        {
          provide: networkConfig.KEY,
          useValue: {
            relayers: [
              {
                externalAccount: komenciAddress
              }
            ],
            fornoURL: 'fornoUrl'
          }
        }
      ]
    })
      .overrideProvider(WEB3_PROVIDER)
      .useValue(buildMockWeb3Provider(() => null))
      .compile()

    repository = module.get<Repository<InviteReward>>(
      getRepositoryToken(InviteReward)
    )
    notifiedBlockRepository = module.get<Repository<NotifiedBlock>>(
      getRepositoryToken(NotifiedBlockRepository)
    )
    service = module.get<InviteRewardService>(InviteRewardService)
    contractKit = module.get(ContractKit)
    escrow = await contractKit.contracts.getEscrow()
    attestations = await contractKit.contracts.getAttestations()

    jest
      .spyOn(contractKit.web3.eth, 'getBlockNumber')
      .mockImplementation(() => Promise.resolve(20))
  })

  interface EscrowEventMetadata {
    txHash: string
    inviter: string
    blockNumber: number
    token?: string
  }

  const mockCusdTokenAddress = (tokenAddress: string) => {
    jest
      .spyOn(contractKit.registry, 'addressFor')
      .mockImplementation(() => Promise.resolve(tokenAddress))
  }

  const mockEscrowEvents = (
    events: EscrowEventMetadata[]
  ): jest.SpyInstance => {
    return jest.spyOn(escrow, 'getPastEvents').mockImplementation(() =>
      Promise.resolve(
        events.map(metadata =>
          partialEventLog({
            transactionHash: metadata.txHash,
            blockNumber: metadata.blockNumber,
            returnValues: {
              identifier: 'qwerty',
              token: metadata.token ?? cUsdTokenAddress,
              to: metadata.inviter
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
        key: 'inviteReward',
        blockNumber
      })
    )
  }

  interface TxData {
    from: string
    to: string
  }
  const mockGetTransaction = (txData: { [txHash: string]: TxData }) => {
    jest
      .spyOn(contractKit.web3.eth, 'getTransaction')
      .mockImplementation(txHash => {
        const { from, to } = txData[txHash]
        return Promise.resolve(
          partialTransaction({
            from,
            to
          })
        )
      })
  }

  const mockAttestationStats = (addressAttestations: {
    [address: string]: AttestationStat
  }) => {
    jest
      .spyOn(attestations, 'getAttestationStat')
      .mockImplementation((_, address) =>
        Promise.resolve(
          addressAttestations[address] ?? {
            completed: 0,
            total: 0
          }
        )
      )
  }

  const mockInviterCount = (invitersCount: { [inviter: string]: number }) => {
    jest
      .spyOn(repository, 'findAndCount')
      .mockImplementation((options: any) =>
        Promise.resolve([[], invitersCount[options.where.inviter] ?? 0])
      )
  }

  const mockFindInviteeReward = (inviteeRewards: {
    [invitee: string]: InviteReward | undefined
  }) => {
    jest
      .spyOn(repository, 'findOne')
      .mockImplementation((options: any) =>
        Promise.resolve(inviteeRewards[options.invitee])
      )
  }

  describe('#sendInviteRewards', () => {
    const saveBlockMock = jest.fn()
    const saveInviteRewardMock = jest.fn()
    let notifiedBlockId

    beforeEach(() => {
      notifiedBlockId = uuidv4()
      mockFindBlock(notifiedBlockId, 10)
      notifiedBlockRepository.save = saveBlockMock
      mockCusdTokenAddress(cUsdTokenAddress)
      mockEscrowEvents([
        {
          txHash: inviteTxHash,
          inviter: inviterAddress,
          blockNumber: 20
        }
      ])
      mockGetTransaction({
        [inviteTxHash]: { from: komenciAddress, to: inviteeAddress }
      })
      mockAttestationStats({
        [inviterAddress]: { completed: 3, total: 3 },
        [inviteeAddress]: { completed: 3, total: 3 }
      })
      mockInviterCount({ [inviterAddress]: 0 })
      mockFindInviteeReward({ [inviteeAddress]: undefined })
      repository.save = saveInviteRewardMock
    })

    describe('when a new reward must be sent', () => {
      it('sends it', async () => {
        await service.sendInviteRewards()

        expect(saveInviteRewardMock).toHaveBeenCalledWith(
          expect.objectContaining({
            inviter: inviterAddress,
            invitee: inviteeAddress,
            state: RewardStatus.Created
          })
        )
        expect(saveBlockMock).toHaveBeenCalledWith(
          NotifiedBlock.of({
            id: notifiedBlockId,
            key: 'inviteReward',
            blockNumber: 20
          })
        )
      })
    })

    describe('when a reward is already active for the invitee', () => {
      beforeEach(() => {
        mockFindInviteeReward({
          [inviteeAddress]: {
            id: 'any',
            invitee: inviteeAddress,
            inviter: 'any',
            inviteeIdentifier: 'identifier',
            state: RewardStatus.Created,
            rewardTxHash: undefined,
            createdAt: new Date(Date.now()).toISOString()
          }
        })
      })

      it('doesnt send another one', async () => {
        await service.sendInviteRewards()

        expect(saveInviteRewardMock).not.toHaveBeenCalled()
        expect(saveBlockMock).toHaveBeenCalledWith(
          NotifiedBlock.of({
            id: notifiedBlockId,
            key: 'inviteReward',
            blockNumber: 20
          })
        )
      })
    })

    describe('when the invitee is not verified', () => {
      beforeEach(() => {
        mockAttestationStats({
          [inviterAddress]: { completed: 3, total: 3 },
          [inviteeAddress]: { completed: 0, total: 0 }
        })
      })

      it('doesnt send the reward', async () => {
        await service.sendInviteRewards()

        expect(saveInviteRewardMock).not.toHaveBeenCalled()
        expect(saveBlockMock).toHaveBeenCalledWith(
          NotifiedBlock.of({
            id: notifiedBlockId,
            key: 'inviteReward',
            blockNumber: 20
          })
        )
      })
    })

    describe("when the tx doesn't come from a komenci address", () => {
      beforeEach(() => {
        mockGetTransaction({
          [inviteTxHash]: { from: inviterAddress, to: inviteeAddress }
        })
      })

      it('doesnt send the reward', async () => {
        await service.sendInviteRewards()

        expect(saveInviteRewardMock).not.toHaveBeenCalled()
        expect(saveBlockMock).toHaveBeenCalledWith(
          NotifiedBlock.of({
            id: notifiedBlockId,
            key: 'inviteReward',
            blockNumber: 20
          })
        )
      })
    })

    describe('when the inviter has reached the weekly limit', () => {
      beforeEach(() => {
        mockInviterCount({ [inviterAddress]: 25 })
      })

      it('doesnt send the reward', async () => {
        await service.sendInviteRewards()

        expect(saveInviteRewardMock).not.toHaveBeenCalled()
        expect(saveBlockMock).toHaveBeenCalledWith(
          NotifiedBlock.of({
            id: notifiedBlockId,
            key: 'inviteReward',
            blockNumber: 20
          })
        )
      })
    })

    describe('when the invite is not in cUSD', () => {
      beforeEach(() => {
        mockEscrowEvents([
          {
            txHash: inviteTxHash,
            inviter: inviterAddress,
            blockNumber: 20,
            token: 'notCusdToken'
          }
        ])
      })

      it('doesnt send the reward', async () => {
        await service.sendInviteRewards()

        expect(saveInviteRewardMock).not.toHaveBeenCalled()
        expect(saveBlockMock).toHaveBeenCalledWith(
          NotifiedBlock.of({
            id: notifiedBlockId,
            key: 'inviteReward',
            blockNumber: 20
          })
        )
      })
    })
  })
})
