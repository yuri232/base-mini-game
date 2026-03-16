import { createWalletClient, custom } from "viem"
import { base } from "viem/chains"

const contractAddress = "0x76e7864d1Aa366427022e29ce7c460D03664Aee8"

const abi = [
  {
    name: "gm",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  }
]

export async function sendGM() {

  const walletClient = createWalletClient({
    chain: base,
    transport: custom((window as any).ethereum)
  })

  const [account] = await walletClient.getAddresses()

  await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: "gm",
    account
  })

}