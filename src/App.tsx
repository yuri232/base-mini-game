import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import { sendGM } from "./gmContract"

type Card = {
  id:number
  value:string
  isFlipped:boolean
  isMatched:boolean
}

type LeaderboardEntry = {
  id:number
  username:string
  moves:number
  difficulty:string
}

const icons = [
"sand","avnt","shib","cake","trac","flux","red","zro",
"zen","bal","bdx","link","w","bonk","zbu","zora",
"beam","morpho","carv","moca","rsr","aero","vvv"
]

function generateCards(size:number):Card[]{

const pairs=(size*size)/2
const selected=icons.slice(0,pairs)

const cards:Card[]=[]

selected.forEach((icon,i)=>{

cards.push(
{id:i*2,value:icon,isFlipped:false,isMatched:false},
{id:i*2+1,value:icon,isFlipped:false,isMatched:false}
)

})

return cards.sort(()=>Math.random()-0.5)

}

export default function App(){

const[grid,setGrid]=useState(6)
const[cards,setCards]=useState<Card[]>([])
const[flipped,setFlipped]=useState<number[]>([])
const[moves,setMoves]=useState(0)
const[leaderboard,setLeaderboard]=useState<LeaderboardEntry[]>([])
const[gmSent,setGMSent]=useState(false)
const[streak,setStreak]=useState(0)

useEffect(()=>{

startGame()

},[grid])

async function loadLeaderboard(){

const{data}=await supabase
.from("leaderboard")
.select("*")
.order("moves",{ascending:true})
.limit(10)

if(data)setLeaderboard(data)

}

function startGame(){

setCards(generateCards(grid))
setMoves(0)
setFlipped([])

loadLeaderboard()

}

async function saveScore(){

await supabase.from("leaderboard").insert({

username:"player",
moves,
difficulty:grid===4?"4x4":"6x6"

})

loadLeaderboard()

}

function handleCardClick(id:number){

const card=cards.find(c=>c.id===id)

if(!card||card.isFlipped||card.isMatched||flipped.length===2)return

setCards(prev=>
prev.map(c=>
c.id===id?{...c,isFlipped:true}:c
)
)

setFlipped(prev=>[...prev,id])

}

useEffect(()=>{

if(flipped.length!==2)return

const[a,b]=flipped

const first=cards.find(c=>c.id===a)
const second=cards.find(c=>c.id===b)

if(!first||!second)return

if(first.value===second.value){

setCards(prev=>
prev.map(c=>
c.id===a||c.id===b
?{...c,isMatched:true}
:c
)
)

}else{

setTimeout(()=>{

setCards(prev=>
prev.map(c=>
c.id===a||c.id===b
?{...c,isFlipped:false}
:c
)
)

},700)

}

setMoves(m=>m+1)
setFlipped([])

},[flipped])

useEffect(()=>{

if(cards.length>0&&cards.every(c=>c.isMatched)){

saveScore()

}

},[cards])

async function updateStreak(wallet:string){

const today=new Date().toISOString().slice(0,10)

const{data}=await supabase
.from("gm_streak")
.select("*")
.eq("wallet",wallet)
.single()

if(!data){

await supabase.from("gm_streak").insert({

wallet,
streak:1,
last_gm:today

})

setStreak(1)
return

}

const last=data.last_gm
const lastDate=new Date(last)
const nowDate=new Date(today)

const diff=(nowDate.getTime()-lastDate.getTime())/86400000

let newStreak=1

if(diff===1){

newStreak=data.streak+1

}

await supabase
.from("gm_streak")
.update({
streak:newStreak,
last_gm:today
})
.eq("wallet",wallet)

setStreak(newStreak)

}

async function handleGM(){

try{

await sendGM()

const wallet=(window as any).ethereum.selectedAddress

if(wallet){

updateStreak(wallet)

}

setGMSent(true)

}catch(e){

console.error(e)

}

}

return(

<div style={{
minHeight:"100vh",
background:"linear-gradient(135deg,#0f172a,#1e3a8a)",
color:"white",
textAlign:"center",
padding:20
}}>

<h1>Memory Game</h1>

<button onClick={handleGM}>
Send GM
</button>

{gmSent&&(
<p style={{color:"#22c55e"}}>
GM sent successfully 🚀
</p>
)}

<p>🔥 GM streak: {streak}</p>

<div style={{marginTop:20}}>

<button onClick={()=>setGrid(4)}>
4×4
</button>

<button onClick={()=>setGrid(6)}>
6×6
</button>

<button onClick={startGame}>
New Game
</button>

</div>

<p>Moves: {moves}</p>

<div style={{
display:"grid",
gridTemplateColumns:`repeat(${grid},1fr)`,
gap:10,
maxWidth:600,
margin:"20px auto"
}}>

{cards.map(card=>(

<div
key={card.id}
onClick={()=>handleCardClick(card.id)}
style={{
aspectRatio:1,
background:card.isFlipped||card.isMatched
?"#fff"
:"#2563eb",
borderRadius:12,
display:"flex",
alignItems:"center",
justifyContent:"center",
cursor:"pointer"
}}
>

{(card.isFlipped||card.isMatched)&&(
<img
src={`/icons/${card.value}.png`}
style={{width:"60%"}}
/>
)}

</div>

))}

</div>

<h2>🏆 Leaderboard</h2>

<div style={{maxWidth:400,margin:"0 auto"}}>

{leaderboard.map((entry,index)=>(

<div key={entry.id} style={{
display:"flex",
justifyContent:"space-between",
padding:6
}}>

<span>
{index+1}. {entry.username}
</span>

<span>
{entry.moves} ({entry.difficulty})
</span>

</div>

))}

</div>

</div>

)

}