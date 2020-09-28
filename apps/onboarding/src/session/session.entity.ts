import {Column, Entity, PrimaryGeneratedColumn} from "typeorm"

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

    @Column('simple-json')
    meta?: object

    @Column('timestamp')
    createdAt: string

    @Column('timestamp')
    expiredAt: string

    @Column('timestamp')
    completedAt: string
}
    
