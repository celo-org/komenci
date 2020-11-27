import { RelayerCommandDto } from 'apps/relayer/src/dto/RelayerCommandDto'
import {
  IsNotEmpty,
} from 'class-validator'

export class SignPersonalMessageDto extends RelayerCommandDto {
  @IsNotEmpty()
  data: string
}
