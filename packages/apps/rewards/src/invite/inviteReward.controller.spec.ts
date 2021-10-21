import { StableToken } from '@celo/contractkit'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InviteRewardController } from './inviteReward.controller'
import { InviteReward, RewardStatus } from './inviteReward.entity'
import { InviteRewardRepository } from './inviteReward.repository'

jest.mock('./inviteReward.repository')

describe('InviteRewardController', () => {
  let controller: InviteRewardController
  let repository: InviteRewardRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [InviteRewardController],
      providers: [
        {
          provide: getRepositoryToken(InviteReward),
          useClass: Repository
        }
      ]
    }).compile()

    controller = await module.resolve(InviteRewardController)
    repository = module.get<Repository<InviteReward>>(
      getRepositoryToken(InviteReward)
    )
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('#invite_reward', () => {
    const txHash = '0x1234'
    const inviteReward: InviteReward = {
      id: '0123',
      inviter: '0x1',
      invitee: '0x2',
      inviteeIdentifier: '0x3',
      rewardTxHash: txHash,
      state: RewardStatus.Completed,
      inviteToken: StableToken.cUSD,
      createdAt: Date.now().toString()
    }

    describe('when the tx hash exists', () => {
      it('returns the invite reward', async () => {
        const findOne = jest
          .spyOn(repository, 'findOne')
          .mockResolvedValue(inviteReward)

        const result = await controller.inviteReward(txHash)

        expect(findOne).toHaveBeenCalledWith({ rewardTxHash: txHash })
        expect(result).toEqual(inviteReward)
      })
    })

    describe('when the tx hash doesnt exist', () => {
      it('returns empty result', async () => {
        const findOne = jest
          .spyOn(repository, 'findOne')
          .mockResolvedValue(undefined)

        const result = await controller.inviteReward(txHash)
        expect(findOne).toHaveBeenCalledWith({ rewardTxHash: txHash })
        expect(result).toEqual(undefined)
      })
    })
  })
})
