import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm'

const inviteRewardTable = 'invite_reward'
const index = new TableIndex({
  columnNames: ['state']
})

export class AddIndexOnRewardState1620185961145 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(inviteRewardTable, index)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(inviteRewardTable, index)
  }
}
