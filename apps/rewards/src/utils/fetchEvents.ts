import { EventLog } from 'web3-core'

const EVENTS_BATCH_SIZE = 10000

export async function fetchEvents(
  contract: any,
  event: string,
  fromBlock: number,
  toBlock: number,
  batchSize: number = EVENTS_BATCH_SIZE
) {
  const allEvents: EventLog[] = []
  let currentFromBlock = fromBlock
  while (currentFromBlock < toBlock) {
    const events = await contract.getPastEvents(event, {
      fromBlock: currentFromBlock,
      toBlock: Math.min(currentFromBlock + batchSize, toBlock)
    })
    allEvents.push(...events)
    currentFromBlock += batchSize + 1
  }
  return allEvents
}
