import { MigrationInterface, QueryRunner, Table } from 'typeorm'

/* tslint:disable */
export class session1607954006850 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'session',
        columns: [
          {
            name: 'id',
            type: 'uuid'
            // isPrimary: true,
          },
          {
            name: 'externalAccount',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'meta',
            type: 'json',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false
          },
          {
            name: 'expiredAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true
          }
        ]
      }),
      true
    )
  }
  public async down(queryRunner: QueryRunner): Promise<any> {
    queryRunner.query(`DROP TABLE session`)
  }
}
