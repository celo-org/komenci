import { Injectable, LoggerService } from '@nestjs/common'
import { Logger } from "nestjs-pino"

import {
    AttestationsRequested,
    KomenciEvent,
    MetaTransactionSubmitted,
    PepperRequested,
    RuleVerified,
    TxEvent,
    WalletDeployed
} from '@app/komenci-logger/events'

export interface KomenciLogger extends LoggerService {
    logSuccessfulSessionStart: (sessionStartFailEvent: KomenciEvent) => void
    logFailedSessionStart: (sessionStartFailEvent: KomenciEvent) => void
    logRuleChecked: (ruleVerifiedEvent: RuleVerified) => void
    logWalletDeployed: (walletDeployEvent: WalletDeployed) => void
    logBlindedPepperRequest: (pepperRequestEvent: PepperRequested) => void
    logCompletedTransaction: (txEvent: TxEvent) => void
    logSubmittedMetaTransaction: (submittedMTx: MetaTransactionSubmitted) => void
    logSubsidizedAttestations: (attestationsRequested: AttestationsRequested) => void
}

@Injectable()
export class KomenciLoggerService implements KomenciLogger {
    constructor(private readonly logger: Logger) {}
    log(message: any, context?: any, ...args): void {
        this.logger.log(message, context, ...args)
    }
    verbose(message: any, context?: any, ...args): void {
        this.logger.verbose(message, context, ...args)
    }
    debug(message: any, context?: any, ...args): void {
        this.logger.debug(message, context, ...args)
    }
    warn(message: any, context?: any, ...args): void {
        this.logger.warn(message, context, ...args)
    }
    error(message: any, context?: any, ...args): void {
        this.logger.error(message, context, ...args)
    }


    logSuccessfulSessionStart(sessionStartEvent: KomenciEvent): void {
        this.log("Session Started Successfully", sessionStartEvent)
    }

    logFailedSessionStart(sessionStartFailEvent: KomenciEvent): void {
        this.log('Session Start Failed', sessionStartFailEvent)
    }

    logRuleChecked(ruleVerifiedEvent: RuleVerified): void {
        this.log('Rule Verified', ruleVerifiedEvent)
    }

    logWalletDeployed(walletDeployEvent: WalletDeployed): void {
        this.log('Wallet Deployed', walletDeployEvent)
    }

    logBlindedPepperRequest(pepperRequestEvent: PepperRequested): void {
        this.log('Blinded Pepper Request', pepperRequestEvent)
    }

    logCompletedTransaction(txEvent: TxEvent): void {
        this.log('Transaction Successful', txEvent)
    }

    logSubmittedMetaTransaction(submittedMTx: MetaTransactionSubmitted): void {
        this.log('MetaTransaction Submitted', submittedMTx)
    }
    logSubsidizedAttestations(attestationsRequested: AttestationsRequested): void {
        this.log('Subsidized Attestations Request', attestationsRequested)
    }


}
