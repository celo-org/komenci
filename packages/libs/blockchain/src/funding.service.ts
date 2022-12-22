import { CeloTxObject, TransactionResult } from '@celo/connect'
import { Address, ContractKit } from '@celo/contractkit'
import { RelayerAccounts } from '@komenci/core'
import { Inject, Injectable } from '@nestjs/common'
import BigNumber from 'bignumber.js'
import { CeloTransactionObject } from '@celo/connect'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'


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
    @Inject(ContractKit)
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

    console.log(`Disbursing ${cUSDAmount} cUSD and ${celoAmount} CELO to ${relayers.length} relayers`)
    console.log(`Fund: ${fund}`)
    const relayerTxs = await Promise.all(
      relayers.map(async (relayer, idx) => {
        // @ts-ignore
        const cUSDTx = cUSD.transfer(relayer.metaTransactionWallet, cUSDAmountSubunit.toFixed()).send({
          from: fund,
        })
        // @ts-ignore
        const celoTx = celo.transfer(relayer.externalAccount, celoAmountSubunit.toFixed()).send({
          from: fund,
        })


        return Promise.all([cUSDTx, celoTx])
      })
    )

    return relayers.reduce((summary, relayer, idx) => {
      summary[relayer.externalAccount] = {
        cUSD: relayerTxs[idx][0],
        celo: relayerTxs[idx][1],
      }
      return summary
    }, {})
  }

  public async withdrawFunds(
    relayer: Address, 
    to: Address,
    cUSDAmount: number,
    celoAmount: number
  ): Promise<void> {
    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const exp = new BigNumber(10).pow(18)
    const cUSDAmountSubunit = new BigNumber(cUSDAmount).times(exp)
    const celoAmountSubunit = new BigNumber(celoAmount).times(exp)
    
    const balances = await this.getFundBalance(relayer)
    if (balances.celo.isLessThan(celoAmountSubunit) || balances.cUSD.isLessThan(cUSDAmountSubunit)) {
      throw(new Error("Relayer does not have enough funds to withdraw"))
    }
    console.log(`Withdrawing ${cUSDAmount} cUSD and ${celoAmount} CELO from ${relayer} to ${to}`)

    const wallet = await this.contractKit.contracts.getMetaTransactionWallet(relayer)
    console.log(`test`)
    const relayerAddress = await wallet.signer()
    console.log(`Withdrawing ${cUSDAmount} cUSD and ${celoAmount} CELO from ${relayer} to ${to} (relayer address: ${relayerAddress})`)

    let txs: CeloTxObject<boolean>[] = []
    if (cUSDAmount > 0.01) {
      txs.push(cUSD.transfer(to, cUSDAmountSubunit.toFixed()).txo)
    }
    if (celoAmount > 0.01) {
      txs.push(celo.transfer(to, celoAmountSubunit.toFixed()).txo)
    }
    await wallet.executeTransactions(txs).sendAndWaitForReceipt({from: relayerAddress})

    console.log(`Withdrew ${cUSDAmount} cUSD and ${celoAmount} CELO from ${relayer}`)
  }

  public async withdrawAll(
    relayer: Address, 
    to: Address,
  ): Promise<void> {
    const balances = await this.getFundBalance(relayer)
    const exp = new BigNumber(10).pow(18)
    const celoRemanent = new BigNumber(0.01).times(exp)

    console.log(``)
    console.log(`cUSD: ${balances.cUSD.div(exp).toNumber()}`)
    console.log(`celo: ${balances.celo.minus(celoRemanent).div(exp).toNumber()}`)
    // this.withdrawFunds(
    //   relayer,
    //   to,
    //   balances.cUSD.div(exp).toNumber(),
    //   balances.celo.minus(celoRemanent).div(exp).toNumber(),
    // )
    
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