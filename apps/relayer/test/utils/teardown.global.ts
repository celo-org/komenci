import teardown from '../../../../libs/celo/packages/dev-utils/lib/ganache-teardown'
// @ts-ignore

export default async function globalTeardown() {
  await teardown()
}
