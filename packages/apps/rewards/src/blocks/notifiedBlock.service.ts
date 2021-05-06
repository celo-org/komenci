import { KomenciLoggerService } from '@komenci/logger'
import { ContractKit } from '@celo/contractkit'
import { Injectable } from '@nestjs/common'
import { LessThan } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'

export enum StartingBlock {
  Genesis,
  Latest
}

@Injectable()
export class NotifiedBlockService {
  constructor(
    private readonly notifiedBlockRepository: NotifiedBlockRepository,
    private readonly contractKit: ContractKit,
    private readonly logger: KomenciLoggerService
  ) {}

  async runUsingLastNotifiedBlock(
    notifiedBlockKey: string,
    startingBlock: StartingBlock,
    handleBlockFn: (blockNumber: number) => Promise<number>
  ) {
    try {
      let lastNotifiedBlock = await this.notifiedBlockRepository.findOne({
        key: notifiedBlockKey
      })
      if (!lastNotifiedBlock) {
        const blockNumber =
          startingBlock === StartingBlock.Genesis
            ? 0
            : await this.contractKit.web3.eth.getBlockNumber()
        lastNotifiedBlock = {
          id: uuidv4(),
          key: notifiedBlockKey,
          blockNumber
        }
        await this.notifiedBlockRepository.insert(lastNotifiedBlock)
      }
      const fromBlock = lastNotifiedBlock.blockNumber + 1
      const lastBlock = await handleBlockFn(fromBlock)
      if (lastBlock > fromBlock) {
        await this.notifiedBlockRepository.update(
          {
            id: lastNotifiedBlock.id,
            key: notifiedBlockKey,
            blockNumber: LessThan(lastBlock)
          },
          {
            blockNumber: lastBlock
          }
        )
      }
    } catch (error) {
      this.logger.error(
        `Error while processing blocks for key ${notifiedBlockKey}: ${error}`
      )
    }
  }
}
