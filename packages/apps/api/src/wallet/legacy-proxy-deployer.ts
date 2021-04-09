import { eqAddress, Err, Ok, Result } from "@celo/base"
import { ContractKit } from "@celo/contractkit"
import { RawTransaction, toRawTransaction } from "@celo/contractkit/lib/wrappers/MetaTransactionWallet"
import { MetaTransactionWalletDeployerWrapper } from "@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer"
import { Injectable, Scope } from "@nestjs/common"
import { WalletNotDeployed } from "./errors"
import { ProxyDeployer } from "./wallet.service"

@Injectable({
  // RelayerProxyService is Request scoped
  scope: Scope.REQUEST
})
export class LegacyProxyDeployer implements ProxyDeployer {
  constructor(
    private readonly deployer: MetaTransactionWalletDeployerWrapper,
    private readonly contractKit: ContractKit,
  ) {}

  async findWallet(blockNumber: number, txHash: string, deployerAddress: string): Promise<Result<string, WalletNotDeployed>> {
    const deployer = 
      (deployerAddress && !eqAddress(deployerAddress, this.deployer.address)) 
      ? await this.contractKit.contracts.getMetaTransactionWalletDeployer(deployerAddress)
      : this.deployer

    const events = await deployer.getPastEvents(
      deployer.eventTypes.WalletDeployed,
      {
        fromBlock: blockNumber,
        toBlock: blockNumber
      }
    )

    const deployWalletLog = events.find(event => event.transactionHash === txHash)

    if (deployWalletLog) {
      return Ok(deployWalletLog.returnValues.wallet)
    } else {
      return Err(new WalletNotDeployed())
    }
  }


  getDeployTransaction(
    owner: string, 
    implementation: string, 
    initCallData: string,
  ): {transaction: RawTransaction, deployerAddress: string} {
    const transaction = toRawTransaction(
      this.deployer.deploy(owner, implementation, initCallData).txo
    )
    return {
      transaction,
      deployerAddress: this.deployer.address
    }
  }

}