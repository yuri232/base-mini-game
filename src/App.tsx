import { useState, useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"
import { supabase } from "./supabase"
import { ethers } from "ethers"
import { GM_ADDRESS, GM_ABI } from "./gmContract"

type Card = {
  id: number
  value: string
  isFlipped: boolean
  isMatched: boolean
}

type LeaderboardEntry = {
  id: number
  fid: number
  username: string
  moves: number
  difficulty: string
}

const icons = [
  "sand","avnt","shib","cake","trac","flux","red","zro",
  "zen","bal","bdx","link","w","bonk","zbu","zora",
  "beam","morpho","carv","moca","rsr","aero","vvv"
]

function generateCards(gridSize: number): Card[] {
  const total = gridSize * gridSize
  const pairCount = total / 2
  const selected = icons.slice(0, pairCount)

  const cards: Card[] = []

  selected.forEach((val, i) => {
    cards.push(
      { id: i * 2 + 1, value: val, isFlipped: false, isMatched: false },
      { id: i * 2 + 2, value: val, isFlipped: false, isMatched: false }
    )
  })

  return cards.sort(() => Math.random() - 0.5)
}

function App() {
  const [difficulty, setDifficulty] = useState<"easy" | "medium">("medium")
  const [cards, setCards] = useState<Card[]>([])
  const [moves, setMoves] = useState(0)
  const [flipped, setFlipped] = useState<number[]>([])
  const [gameWon, setGameWon] = useState(false)

  const [fid, setFid] = useState<number | null>(null)
  const [username, setUsername] = useState<string>("local_dev")
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  // ИЗМЕНЕНО
  const [txStatus, setTxStatus] = useState<string | null>(null)

  const [loadingGM, setLoadingGM] = useState(false)

  const gridSize = difficulty === "easy" ? 4 : 6

  useEffect(() => {
    sdk.actions.ready()

    const loadUser = async () => {
      try {
        const context = await sdk.context
        if (context?.user) {
          setFid(context.user.fid)
          setUsername(context.user.username || "anon")
        }
      } catch {
        setUsername("local_dev")
      }
    }

    loadUser()
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("leaderboard")
      .select("*")
      .order("moves", { ascending: true })
      .limit(10)

    if (data) setLeaderboard(data)
  }

  const saveScore = async () => {
    const userFid = fid ?? 0
    const userName = username || "local_dev"

    await supabase.from("leaderboard").insert({
      fid: userFid,
      username: userName,
      moves,
      difficulty
    })

    fetchLeaderboard()
  }

  useEffect(() => {
    setCards(generateCards(gridSize))
    setMoves(0)
    setFlipped([])
    setGameWon(false)
  }, [difficulty])

  useEffect(() => {
    if (flipped.length !== 2) return

    const [a, b] = flipped
    const first = cards.find(c => c.id === a)
    const second = cards.find(c => c.id === b)

    if (!first || !second) return

    if (first.value === second.value) {
      setCards(prev =>
        prev.map(c =>
          c.id === a || c.id === b
            ? { ...c, isMatched: true }
            : c
        )
      )
    } else {
      setTimeout(() => {
        setCards(prev =>
          prev.map(c =>
            c.id === a || c.id === b
              ? { ...c, isFlipped: false }
              : c
          )
        )
      }, 700)
    }

    setMoves(m => m + 1)
    setFlipped([])
  }, [flipped])

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.isMatched) && !gameWon) {
      setGameWon(true)
      saveScore()
    }
  }, [cards])

  const handleClick = (id: number) => {
    const card = cards.find(c => c.id === id)
    if (!card || card.isFlipped || card.isMatched || flipped.length === 2) return

    setCards(prev =>
      prev.map(c =>
        c.id === id ? { ...c, isFlipped: true } : c
      )
    )

    setFlipped(prev => [...prev, id])
  }

  const newGame = () => {
    setCards(generateCards(gridSize))
    setMoves(0)
    setFlipped([])
    setGameWon(false)
  }

  const handleGM = async () => {
    try {
      if (!window.ethereum) {
        alert("Wallet not found")
        return
      }

      setLoadingGM(true)

      // ИЗМЕНЕНО
      setTxStatus(null)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(GM_ADDRESS, GM_ABI, signer)

      const tx = await contract.gm()
      await tx.wait()

      setTxStatus("GM sent successfully 🚀")
    } catch {
      setTxStatus("Transaction failed")
    } finally {
      setLoadingGM(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f172a,#1e40af)",
      color: "white",
      padding: 20,
      textAlign: "center"
    }}>
      <h1>Memory Game – Base Edition</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setDifficulty("easy")}>Easy 4×4</button>
        <button onClick={() => setDifficulty("medium")}>Medium 6×6</button>
        <button onClick={newGame}>New Game</button>
      </div>

      <p>Moves: {moves}</p>

      {gameWon && (
        <h2 style={{ color: "#22c55e" }}>
          🎉 You won in {moves} moves!
        </h2>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: "10px",
          maxWidth: "600px",
          margin: "20px auto"
        }}
      >
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => handleClick(card.id)}
            style={{
              aspectRatio: "1",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background:
                card.isFlipped || card.isMatched
                  ? "#ffffff"
                  : "linear-gradient(135deg,#2563eb,#3b82f6)",
              boxShadow:
                card.isMatched
                  ? "0 0 12px #22c55e"
                  : "0 4px 10px rgba(0,0,0,0.3)"
            }}
          >
            {card.isFlipped || card.isMatched ? (
              <img
                src={`/icons/${card.value}.png`}
                alt={card.value}
                style={{ width: "70%" }}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 40,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 15
      }}>
        <h2>🏆 Leaderboard</h2>

        <button
          onClick={handleGM}
          disabled={loadingGM}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {loadingGM ? "Processing..." : "GM On-Chain"}
        </button>
      </div>

      {txStatus && <p style={{ marginTop: 8 }}>{txStatus}</p>}

      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        {leaderboard.map((entry, index) => (
          <div
            key={entry.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.2)"
            }}
          >
            <span>{index + 1}. {entry.username}</span>
            <span>{entry.moves}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App