import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { Address, ContractKit } from '@celo/contractkit'
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { Inject, Injectable } from '@nestjs/common'
import BigNumber from 'bignumber.js'

interface RelayerInfo {
  celoBalance: BigNumber,
  metaTxWalletAddress: string
  metaTxWalletCUSDBalance: BigNumber
}

export type BalanceSummary = Record<Address, RelayerInfo>

export interface RelayerDisbursement {
  celo: TransactionResult
  cUSD: TransactionResult
}

export type DisbursementSummary = Record<Address, RelayerDisbursement>


@Injectable()
export class FundingService {
  constructor(
    private readonly deployer: MetaTransactionWalletDeployerWrapper,
    private readonly contractKit: ContractKit,
  ) {}

  public async getRelayerBalances(relayers: Address[]): Promise<BalanceSummary> {
    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const wallets = await this.getWallets(relayers)
    const balances = await Promise.all(
      relayers.map(async (r, idx) => {
        return Promise.all([
          celo.balanceOf(r),
          cUSD.balanceOf(wallets[r]),
        ])
      })
    )

    return balances.reduce((summary, [celoBalance, cUSDBalance], idx) => {
      const relayer = relayers[idx]
      summary[relayer] = {
        celoBalance,
        metaTxWalletAddress: wallets[relayer],
        metaTxWalletCUSDBalance: cUSDBalance
      }
      return summary
    }, {})
  }

  public async disburseFunds(
    fund: Address,
    relayers: Address[],
    cUSDAmount: number,
    celoAmount: number
  ): Promise<DisbursementSummary> {
    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const exp = new BigNumber(10).pow(18)
    const cUSDAmountSubunit = new BigNumber(cUSDAmount).times(exp)
    const celoAmountSubunit = new BigNumber(celoAmount).times(exp)

    if (!await this.fundHasEnoughBalance(
      fund,
      cUSDAmountSubunit,
      celoAmountSubunit,
      relayers.length)
    ) {
      throw(new Error("Fund balance to low to top-up relayers"))
    }

    const wallets = await this.getWallets(relayers)
    return relayers.reduce(async (summary, relayer, idx) => {
      // @ts-ignore
      const cUSDTx = await cUSD.transfer(wallets[relayer], cUSDAmount.toFixed()).send({
        from: fund,
      })
      // @ts-ignore
      const celoTx = await celo.transfer(relayer, celoAmount.toFixed()).send({
        from: fund,
      })

      summary[relayer] = {
        celo: celoTx,
        cUSD: cUSDTx
      }

      return summary
    }, {})
  }

  public async getFundBalance(fund: Address): Promise<{celo: BigNumber, cUSD: BigNumber}> {
    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const [celoBalance, cUSDBalance] = await Promise.all([
      celo.balanceOf(fund),
      cUSD.balanceOf(fund),
    ])
    return {
      celo: celoBalance,
      cUSD: cUSDBalance
    }
  }

  private async fundHasEnoughBalance(
    fund: Address,
    cUSDAmount: BigNumber,
    celoAmount: BigNumber,
    relayerCount: number
  ): Promise<boolean> {
    const balances = await this.getFundBalance(fund)
    const cUSDNeeded = cUSDAmount.times(relayerCount)
    const celoNeeded = celoAmount.times(relayerCount)

    if (balances.celo.isLessThan(celoNeeded)) {
      return false
    }

    if (balances.cUSD.isLessThan(cUSDNeeded)) {
      return false
    }

    return true
  }

  private async getWallets(relayers: Address[]): Promise<Record<Address, Address>> {
    const wallets = await Promise.all(
      relayers.map(async (r) => {
        return this.deployer.getWallet(r)
      })
    )

    return wallets.reduce((walletsMap, wallet, idx) => {
      walletsMap[relayers[idx]] = wallet
      return walletsMap
    }, {})
  }
}