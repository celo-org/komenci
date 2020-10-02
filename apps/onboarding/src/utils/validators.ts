import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import Web3 from 'web3'

export function IsCeloAddress() {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isCeloAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `${propertyName} must be a valid Celo address`
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && Web3.utils.isAddress(value)
        },
      },
    })
  }
}