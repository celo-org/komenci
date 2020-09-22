import {Column, Entity, PrimaryGeneratedColumn} from "typeorm"

@Entity()
export class Session {

    public static of(params: Partial<Session>): Session {
        const session = new Session()
    
        Object.assign(session, params)
    
        return session
      }

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    externalAccount: string

    @Column()
    requestedAttestations: number

    @Column()
    completedAttestations: number

    @Column()
    meta: object

    @Column()
    createdAt: number

    @Column()
    expiredAt: number

    @Column()
    completedAt: number
}
    
export class SessionRepositoryFake {
    public createSession(): void {}
    public async findOne(): Promise<void> {}
    public async findAll(): Promise<void> {}
    public async removeSession(): Promise<void> {}
  }
