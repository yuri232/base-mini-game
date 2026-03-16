import { createPublicClient, http } from "viem"
import { base } from "viem/chains"

const client = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org")
})

const GM_ADDRESS = "0x76e7864d1Aa366427022e29ce7c460D03664Aee8"

const GM_EVENT = {
  type: "event",
  name: "GM",
  inputs: [
    { name: "sender", type: "address", indexed: true },
    { name: "timestamp", type: "uint256", indexed: false }
  ]
} as const

export async function getGMLeaderboard() {

  try {

    const logs = await client.getLogs({
      address: GM_ADDRESS,
      event: GM_EVENT,
      fromBlock: 0n
    })

    const counts: Record<string, number> = {}

    logs.forEach((log) => {

      const addr = log.args.sender as string

      counts[addr] = (counts[addr] || 0) + 1

    })

    const leaderboard = Object.entries(counts)
      .map(([address, total]) => ({ address, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return leaderboard

  } catch (err) {

    console.error(err)

    return []

  }

}