import {MigrationInterface, QueryRunner} from "typeorm"

export class AddInviteTokenToInviteReward1633031131296 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE invite_reward ADD COLUMN "inviteToken" varchar(10)`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Do nothing
    }

}
