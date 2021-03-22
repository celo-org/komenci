import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateNotifiedBlock1616435756861 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'notified_block',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'key',
            type: 'varchar',
            isNullable: false,
            isUnique: true
          },
          {
            name: 'blockNumber',
            type: 'integer',
            isNullable: false
          }
        ]
      }),
      true
    )
  }
  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE notified_block`)
  }
}
