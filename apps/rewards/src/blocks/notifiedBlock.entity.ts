import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class NotifiedBlock {
  public static of(params: Partial<NotifiedBlock>): NotifiedBlock {
    const notifiedBlock = new NotifiedBlock()
    Object.assign(notifiedBlock, params)
    return notifiedBlock
  }

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  key: string

  @Column()
  blockNumber: number
}
