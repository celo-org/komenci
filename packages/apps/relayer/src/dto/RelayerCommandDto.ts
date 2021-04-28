import { IsArray, IsHexadecimal, IsOptional, IsString, ValidateNested } from 'class-validator'

export class RelayerTraceContext {
  @IsHexadecimal()
  traceId: string

  @ValidateNested()
  labels: TraceContextLabel[]
}

export class TraceContextLabel {
  @IsString()
  key: string

  @IsString()
  value: string
}

export class RelayerCommandDto {
  @ValidateNested()
  context?: RelayerTraceContext
}

