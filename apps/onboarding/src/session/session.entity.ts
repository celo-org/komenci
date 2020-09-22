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

    // @Column("simple-json")
    // meta: object

    @Column('date')
    createdAt: string

    @Column('date')
    expiredAt: string

    @Column('date')
    completedAt: string
}
    
export class SessionRepositoryFake {
    public createSession(): void {}
    public async findOne(): Promise<void> {}
    public async findAll(): Promise<void> {}
    public async removeSession(): Promise<void> {}
  }
