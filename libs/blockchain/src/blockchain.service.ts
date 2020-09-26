import { CONTRACT_KIT } from '@app/blockchain/blockchain.module';
import { ContractKit } from '@celo/contractkit';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class BlockchainService {
  constructor(@Inject(CONTRACT_KIT) contractKit: ContractKit) {
    console.log(contractKit)
  }
}
