import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerException, ThrottlerGuard as BaseThrottlerGuard } from "@nestjs/throttler"
import { THROTTLER_CHECK_ONLY, THROTTLER_KEY } from './constants'


@Injectable()
export class ThrottlerGuard extends BaseThrottlerGuard {
  /**
   * Throttles incoming HTTP requests.
   * All the outgoing requests will contain RFC-compatible RateLimit headers.
   * @see https://tools.ietf.org/id/draft-polli-ratelimit-headers-00.html#header-specifications
   * @throws ThrottlerException
   */
   protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    // Here we start to check the amount of requests being done against the ttl.
    const { req, res } = this.getRequestResponse(context)

    // Return early if the current user agent should be ignored.
    if (Array.isArray(this.options.ignoreUserAgents)) {
      for (const pattern of this.options.ignoreUserAgents) {
        if (pattern.test(req.headers['user-agent'])) {
          return true
        }
      }
    }
    const checkOnly = this.getCheckOnly(context)
    const key = this.getKey(context)
    const ttls = await this.storageService.getRecord(key)
    const nearestExpiryTime = ttls.length > 0 ? Math.ceil((ttls[0] - Date.now()) / 1000) : 0

    // Throw an error when the user reached their limit.
    if (ttls.length >= limit) {
      res.header('Retry-After', nearestExpiryTime)
      throw new ThrottlerException(this.errorMessage)
    }

    res.header(`${this.headerPrefix}-Limit`, limit)
    // We're about to add a record so we need to take that into account here.
    // Otherwise the header says we have a request left when there are none.
    res.header(`${this.headerPrefix}-Remaining`, Math.max(0, limit - (ttls.length + 1)))
    res.header(`${this.headerPrefix}-Reset`, nearestExpiryTime)

    if (checkOnly === false) {
      await this.storageService.addRecord(key, ttl)
    }
    return true
  }

  private getCheckOnly(context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean | undefined>(THROTTLER_CHECK_ONLY, [
      context.getHandler(),
      context.getClass()
    ]) || false
  }

  private getKey(context: ExecutionContext): string {
    const key = this.reflector.getAllAndOverride<string | undefined>(THROTTLER_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (key !== undefined) {
      return key
    } else {
      const { req } = this.getRequestResponse(context)
      const tracker = this.getTracker(req)
      return this.generateKey(context, tracker)
    }
  }
}