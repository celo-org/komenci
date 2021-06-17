import {Column, Entity, PrimaryGeneratedColumn} from "typeorm"
import { ActionCounts, TrackedAction } from '../config/quota.config'
import { WalletProxyType } from "../wallet/wallet.service"


export interface SessionMetadata {
    walletDeploy?: {
        startedAt: number,
        txHash: string,
        implementationAddress: string,
        deployerAddress: string,
        proxyType: WalletProxyType
    }
    callCount: ActionCounts
}

@Entity()
export class Session {

    public static of(params: Partial<Session>): Session {
        const session = new Session()
        Object.assign(session, params)
        return session
    }

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    externalAccount: string

    @Column('json', {nullable: true, default: {callCount: {}}})
    meta?: SessionMetadata

    @Column('timestamp')
    createdAt: string

    @Column('timestamp', {nullable: true})
    expiredAt?: string

    @Column('timestamp', {nullable: true})
    completedAt?: string

    getActionCount(action: TrackedAction): number {
        return this.meta?.callCount[action] || 0
    }
}
