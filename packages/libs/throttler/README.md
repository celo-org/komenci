# @komenci/throttler

A `decorator` and `guard` meant to be used in conjunction with `@nestjs/throttler` to allow two endpoints to query the same key but only one to count it down.

In `@komenci/api` we want to throttle the `startSession` action but in order to execute that the user needs to solve a captcha. In order to avoid solving this captcha unnecessarily, we introduce a `ready` endpoint which acts as a sentinel for throttling. Meaning that if `startSession` is throttled, both `startSession` and `ready` will return 429, but if not `ready` will return 200 but will not increase the throttle counter for `startSession`.