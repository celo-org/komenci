import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateAttestation1617063533846 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'attestation',
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
            isNullable: false,
            isUnique: true
          },
          {
            name: 'address',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'identifier',
            type: 'varchar',
            isNullable: false
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            isNullable: false
          }
        ],
      }),
      true
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "attestation"`)
  }
}
