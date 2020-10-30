import {Column, Entity, PrimaryGeneratedColumn} from "typeorm"

export enum SessionQuota {
    DistributedBlindedPepper = 'distributedBlindedPepper',
    RequestSubsidisedAttestation = 'requestSubsidisedAttestation',
    SubmitMetaTransaction = 'submitMetaTransaction',
}

interface SessionMetadata {
    walletDeploy?: {
        startedAt: number,
        txHash: string,
        implementationAddress: string
    }
    quota?: {[quotaName in SessionQuota]?: number}
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

    @Column()
    requestedAttestations: number

    @Column()
    completedAttestations: number

    @Column('json', {nullable: true, default: {quota: {}}})
    meta?: SessionMetadata

    @Column('timestamp')
    createdAt: string

    @Column('timestamp', {nullable: true})
    expiredAt?: string

    @Column('timestamp', {nullable: true})
    completedAt?: string

    isOpen(): boolean {
        return !this.expiredAt && !this.completedAt
    }

    checkQuota(quota: SessionQuota, updateUsage: boolean = true) {
        const usage = this.meta.quota[quota] || 0
        if (updateUsage) {
            this.meta.quota[quota] = usage + 1
        }
        return usage
    }
}
    
