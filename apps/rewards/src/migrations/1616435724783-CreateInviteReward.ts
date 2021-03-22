import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateInviteReward1616435724783 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'invite_reward',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'inviter',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'invitee',
            type: 'varchar',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'state',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'rewardTxHash',
            type: 'varchar',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false
          }
        ]
      }),
      true
    )
  }
  public async down(queryRunner: QueryRunner): Promise<any> {
    queryRunner.query(`DROP TABLE invite_reward`)
  }
}
