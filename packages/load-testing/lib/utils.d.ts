import { ContractKit } from '@celo/contractkit';
import { LoginSignatureError, TxEventNotFound, TxRevertError, TxTimeoutError } from '@komenci/kit/lib/errors';
import { TransactionReceipt } from 'web3-core';
export declare function getLoginSignature(contractKit: ContractKit, account: any, captchaToken: string): Promise<import("@celo/base/lib/result").OkResult<string> | import("@celo/base/lib/result").ErrorResult<LoginSignatureError>>;
export declare function getAddressFromDeploy(contractKit: any, externalAccount: any, txHash: string): Promise<import("@celo/base/lib/result").ErrorResult<TxTimeoutError> | import("@celo/base/lib/result").ErrorResult<TxRevertError> | import("@celo/base/lib/result").ErrorResult<TxEventNotFound> | import("@celo/base/lib/result").OkResult<any>>;
export declare function waitForReceipt(contractKit: ContractKit, txHash: string): Promise<import("@celo/base/lib/result").ErrorResult<TxTimeoutError> | import("@celo/base/lib/result").ErrorResult<TxRevertError> | import("@celo/base/lib/result").OkResult<TransactionReceipt>>;
