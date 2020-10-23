import {Column, Entity, PrimaryGeneratedColumn} from "typeorm"

interface SessionMetadata {
    walletDeploy: {
        startedAt: number,
        txHash: string,
        implementationAddress: string
    }
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

    @Column('json', {nullable: true})
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
}
    
