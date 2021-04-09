import { eqAddress, Err, Ok, Result } from "@celo/base"
import { ContractKit } from "@celo/contractkit"
import { RawTransaction } from "@celo/contractkit/lib/wrappers/MetaTransactionWallet"
import { abi as ProxyCloneFactoryABI } from '@komenci/contracts/artefacts/ProxyCloneFactory.json'
import { networkConfig, NetworkConfig } from "@komenci/core"
import { Inject, Injectable, Scope } from "@nestjs/common"
import { Contract } from "web3-eth-contract"
import { WalletNotDeployed } from "./errors"
import { ProxyDeployer } from "./wallet.service"

/*
 * XXX: This is a low-level implementation based on the contract version in 
 * asaj/gas-efficiency. We should replace this with using a wrapper akin
 * to how things look in the `legacy-proxy-deployer.ts`
 */

@Injectable({
  // RelayerProxyService is Request scoped
  scope: Scope.REQUEST
})
export class EIP1167ProxyDeployer implements ProxyDeployer {
  deployer: Contract
  constructor(
    @Inject(networkConfig.KEY)
    networkCfg: NetworkConfig,
    private contractKit: ContractKit
  ) {
    this.deployer = new contractKit.web3.eth.Contract(
      ProxyCloneFactoryABI as any,
      networkCfg.contracts.ProxyCloneFactory
    )
  }

  async findWallet(blockNumber: number, txHash: string, deployerAddress: string): Promise<Result<string, WalletNotDeployed>> {
    const deployer = 
      (deployerAddress && !eqAddress(deployerAddress, this.deployer.options.address))
      ? new this.contractKit.web3.eth.Contract(ProxyCloneFactoryABI as any, deployerAddress)
      : this.deployer

    const events = await deployer.getPastEvents(
      'ProxyCreated',
      {
        fromBlock: blockNumber,
        toBlock: blockNumber
      }
    )

    const deployWalletLog = events.find(event => event.transactionHash === txHash)

    if (deployWalletLog) {
      return Ok(deployWalletLog.returnValues.proxy)
    } else {
      return Err(new WalletNotDeployed())
    }
  }


  getDeployTransaction(
    owner: string, 
    implementation: string, 
    initCallData: string,
  ): {transaction: RawTransaction, deployerAddress: string} {
    const transaction: RawTransaction = {
      destination: this.deployer.options.address,
      value: "0x0",
      data: this.deployer.methods.deployV2(implementation, initCallData).encodeABI()
    }
    return {
      transaction,
      deployerAddress: this.deployer.options.address
    }
  }

}