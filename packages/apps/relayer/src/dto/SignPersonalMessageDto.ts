import {
  IsNotEmpty,
} from 'class-validator'
import { RelayerCommandDto } from './RelayerCommandDto'

export class SignPersonalMessageDto extends RelayerCommandDto {
  @IsNotEmpty()
  data: string
}
