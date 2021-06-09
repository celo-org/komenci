import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateAccountWalletMapping1621997305128
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'account_wallet_mapping',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isNullable: false,
            isPrimary: true
          },
          {
            name: 'txHash',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'accountAddress',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'walletAddress',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false
          }
        ],
        indices: [{ columnNames: ['walletAddress'] }],
        uniques: [{ columnNames: ['accountAddress', 'walletAddress'] }]
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "account_wallet_mapping"`)
  }
}
