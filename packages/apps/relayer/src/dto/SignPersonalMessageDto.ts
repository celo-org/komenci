import { RelayerCommandDto } from './RelayerCommandDto'
import {
  IsNotEmpty,
} from 'class-validator'

export class SignPersonalMessageDto extends RelayerCommandDto {
  @IsNotEmpty()
  data: string
}
