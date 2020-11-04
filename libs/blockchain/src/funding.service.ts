import { RelayerAccounts } from '@app/utils/config/network.config'
import { Address, ContractKit } from '@celo/contractkit'
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { Injectable } from '@nestjs/common'
import BigNumber from 'bignumber.js'

interface RelayerBalance {
  celoBalance: BigNumber,
  cUSDBalance: BigNumber,
}

export type BalanceSummary = Record<Address, RelayerBalance>

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

  public async getRelayerBalances(relayers: RelayerAccounts[]): Promise<BalanceSummary> {
    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const balances = await Promise.all(
      relayers.map(async (r, idx) => {
        return Promise.all([
          celo.balanceOf(r.externalAccount),
          cUSD.balanceOf(r.metaTransactionWallet),
        ])
      })
    )

    return balances.reduce((summary, [celoBalance, cUSDBalance], idx) => {
      const relayer = relayers[idx]
      summary[relayer.externalAccount] = {
        celoBalance,
        cUSDBalance,
      }
      return summary
    }, {})
  }

  public async disburseFunds(
    fund: Address,
    relayers: RelayerAccounts[],
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


    return relayers.reduce(async (summary, relayer, idx) => {
      // @ts-ignore
      const cUSDTx = await cUSD.transfer(relayer.metaTransactionWallet, cUSDAmountSubunit.toFixed()).send({
        from: fund,
      })
      // @ts-ignore
      const celoTx = await celo.transfer(relayer.externalAccount, celoAmountSubunit.toFixed()).send({
        from: fund,
      })

      summary[relayer.externalAccount] = {
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
}