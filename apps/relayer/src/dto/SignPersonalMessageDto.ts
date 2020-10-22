import {
  IsNotEmpty,
} from 'class-validator'

export class SignPersonalMessageDto {
  @IsNotEmpty()
  data: string
}
