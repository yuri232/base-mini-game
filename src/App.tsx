import { useState, useEffect } from "react"
import { sdk } from '@farcaster/miniapp-sdk'  // ← добавили импорт

type Card = {
  id: number
  value: string
  isFlipped: boolean
  isMatched: boolean
}

const icons = [
  "sand", "avnt", "shib", "cake", "trac", "flux", "red", "zro",
  "zen", "bal", "bdx", "link", "w", "bonk", "zbu", "zora", "beam",
  "morpho", "carv", "moca", "rsr", "aero", "vvv", "bio", "axl",
  "syrup", "vcnt", "kaito", "sushi", "spx", "crv", "brett"
] as const

const STORAGE_KEY = "memory-game-difficulty"

const getSavedDifficulty = (): "easy" | "medium" | "hard" => {
  const saved = localStorage.getItem(STORAGE_KEY)
  return (saved === "easy" || saved === "medium" || saved === "hard") ? saved : "easy"
}

function generateCards(gridSize: number): Card[] {
  const totalCards = gridSize * gridSize
  const pairCount = totalCards / 2

  const selectedIcons = icons.slice(0, Math.min(pairCount, icons.length))

  if (selectedIcons.length < pairCount) {
    console.warn(`Недостаточно иконок! Нужно ${pairCount} пар, есть ${selectedIcons.length}`)
  }

  const cards: Card[] = []

  selectedIcons.forEach((value, index) => {
    cards.push(
      { id: index * 2 + 1, value, isFlipped: false, isMatched: false },
      { id: index * 2 + 2, value, isFlipped: false, isMatched: false }
    )
  })

  while (cards.length < totalCards) {
    const lastValue = selectedIcons[selectedIcons.length - 1] || icons[0] || "sand"
    cards.push(
      { id: cards.length + 1, value: lastValue, isFlipped: false, isMatched: false },
      { id: cards.length + 2, value: lastValue, isFlipped: false, isMatched: false }
    )
  }

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }

  return cards.slice(0, totalCards)
}

function App() {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(getSavedDifficulty())
  const [cards, setCards] = useState<Card[]>(() => {
    const initialSize = getSavedDifficulty() === "easy" ? 4 : getSavedDifficulty() === "medium" ? 6 : 8
    return generateCards(initialSize)
  })
  const [moves, setMoves] = useState(0)
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [gameWon, setGameWon] = useState(false)

  const gridSize =
    difficulty === "easy"   ? 4 :
    difficulty === "medium" ? 6 : 8

  // Самое важное для Base Mini App — сообщаем, что приложение готово
  useEffect(() => {
    sdk.actions.ready()
  }, [])

  // Сохраняем сложность
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, difficulty)
  }, [difficulty])

  // Проверка победы
  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.isMatched)) {
      setGameWon(true)
    }
  }, [cards])

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [firstId, secondId] = flippedCards
      const first  = cards.find(c => c.id === firstId)!
      const second = cards.find(c => c.id === secondId)!

      if (first.value === second.value) {
        setCards(prev =>
          prev.map(c =>
            c.id === firstId || c.id === secondId
              ? { ...c, isMatched: true }
              : c
          )
        )
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              (c.id === firstId || c.id === secondId) && !c.isMatched
                ? { ...c, isFlipped: false }
                : c
            )
          )
        }, 900)
      }

      setMoves(m => m + 1)
      setFlippedCards([])
    }
  }, [flippedCards, cards])

  const handleCardClick = (id: number) => {
    const card = cards.find(c => c.id === id)!
    if (card.isMatched || card.isFlipped || flippedCards.length === 2 || gameWon) return

    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c))
    setFlippedCards(prev => [...prev, id])
  }

  const startNewGame = () => {
    setCards(generateCards(gridSize))
    setMoves(0)
    setFlippedCards([])
    setGameWon(false)
  }

  const getGridStyle = () => ({
    display: "grid",
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gap: "12px",
    maxWidth: "min(95vw, 900px)",
    margin: "20px auto",
    justifyContent: "center",
  })

  if (gameWon) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <h1 style={{ color: "#10b981" }}>You Won! 🎉</h1>
        <p>Moves: {moves}</p>
        <button
          onClick={startNewGame}
          style={{
            marginTop: 20,
            padding: "12px 24px",
            fontSize: "18px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Play Again
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>Memory Game – Base Edition</h1>

      <div style={{ margin: "20px 0", display: "flex", justifyContent: "center", gap: "16px", alignItems: "center" }}>
        <label>Difficulty: </label>
        <select
          value={difficulty}
          onChange={(e) => {
            const newDiff = e.target.value as "easy" | "medium" | "hard"
            setDifficulty(newDiff)
            const newSize = newDiff === "easy" ? 4 : newDiff === "medium" ? 6 : 8
            setCards(generateCards(newSize))
            setMoves(0)
            setFlippedCards([])
            setGameWon(false)
          }}
          style={{ padding: "10px 16px", fontSize: "16px", borderRadius: "6px" }}
        >
          <option value="easy">Easy (4×4)</option>
          <option value="medium">Medium (6×6)</option>
          <option value="hard">Hard (8×8)</option>
        </select>

        <button
          onClick={startNewGame}
          style={{
            padding: "10px 20px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          New Game
        </button>
      </div>

      <p style={{ fontSize: "18px", margin: "16px 0" }}>Moves: {moves}</p>

      <div style={getGridStyle()}>
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: "12px",
              border: "2px solid #d1d5db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: card.isFlipped || card.isMatched ? "#ffffff" : "#3b82f6",
              cursor: "pointer",
              transition: "all 0.3s ease",
              transform: card.isFlipped || card.isMatched ? "scale(1.05)" : "scale(1)",
              boxShadow: card.isFlipped || card.isMatched ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
            }}
          >
            {card.isFlipped || card.isMatched ? (
              <img
                src={`/icons/${card.value}.png`}
                alt={card.value}
                style={{ width: "75%", height: "75%", objectFit: "contain" }}
              />
            ) : (
              <span style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: "bold", color: "white" }}>?</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App