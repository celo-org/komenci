import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Session } from './session.entity'
import { SessionService } from './session.service'


@Module({
    imports: [
    TypeOrmModule.forFeature([Session]),
    ],
    providers: [SessionService],
    exports: [TypeOrmModule, SessionService]
})
export class SessionModule {}