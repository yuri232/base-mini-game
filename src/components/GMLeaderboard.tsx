import { useEffect, useState } from "react"
import { getGMLeaderboard } from "../gmStats"

type Entry = {
  address: string
  total: number
}

export default function GMLeaderboard() {

  const [data, setData] = useState<Entry[]>([])

  useEffect(() => {

    load()

  }, [])

  async function load() {

    const result = await getGMLeaderboard()

    setData(result)

  }

  return (

    <div style={{ marginTop: 40 }}>

      <h2>⛓ On-chain GM Leaderboard</h2>

      <div style={{ maxWidth: 400, margin: "0 auto" }}>

        {data.map((entry, index) => (

          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px",
              borderBottom: "1px solid rgba(255,255,255,0.2)"
            }}
          >

            <span>

              {index + 1}. {entry.address.slice(0,6)}...
              {entry.address.slice(-4)}

            </span>

            <span>

              {entry.total} GM

            </span>

          </div>

        ))}

      </div>

    </div>

  )

}