import { THROTTLER_LIMIT, THROTTLER_TTL } from '@nestjs/throttler/dist/throttler.constants'
import { THROTTLER_CHECK_ONLY, THROTTLER_KEY } from './constants'

interface ThrottleOptions {
  ttl?: number
  limit?: number
  key?: string
  checkOnly?: boolean
}

function setThrottlerMetadata(target: any, opts: ThrottleOptions): void {
  Reflect.defineMetadata(THROTTLER_TTL, opts.ttl, target)
  Reflect.defineMetadata(THROTTLER_LIMIT, opts.limit, target)
  Reflect.defineMetadata(THROTTLER_KEY, opts.key, target)
  Reflect.defineMetadata(THROTTLER_CHECK_ONLY, opts.checkOnly, target)
}
/**
 * Adds metadata to the target which will be handled by the ThrottlerGuard to
 * handle incoming requests based on the given metadata.
 * @usage @Throttle(2, 10)
 * @publicApi
 */
export const Throttle = (opts: ThrottleOptions): MethodDecorator & ClassDecorator => {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    if (descriptor) {
      setThrottlerMetadata(descriptor.value, opts)
      return descriptor
    }
    setThrottlerMetadata(target, opts)
    return target
  }
}