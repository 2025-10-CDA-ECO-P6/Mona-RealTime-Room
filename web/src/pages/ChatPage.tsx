import './ChatPage.scss'
import Navbar from '../components/layout/Navbar'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../lib/socket'

type ChatMessage = {
  text: string
  time: string
  date?: string
  author?: string
}

type PlayerChoice = 'pierre' | 'feuille' | 'ciseaux'
type Winner = 'player1' | 'player2' | 'egalite'
type PlayerRole = 'player1' | 'player2'

type Round = {
  status: 'waiting_for_choices' | 'resolved'
  startedAt: number
  deadlineAt: number
  player1Choice: PlayerChoice | null
  player2Choice: PlayerChoice | null
  winner: Winner | null
}

type Game = {
  score: {
    player1: number
    player2: number
  }
  roundsPlayed: number
  minimumRounds: number
  status: 'in_progress' | 'finished'
  winner: Winner | null
  roundDurationMs: number
  currentRound: Round | null
}

type PublicGameState = {
  game: Game | null
  players: {
    player1: { socketId: string | null; author?: string }
    player2: { socketId: string | null; author?: string }
  }
}

function ChatPage() {
  const navigate = useNavigate()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [roomError, setRoomError] = useState<string | null>(null)

  const [pseudo] = useState(() => localStorage.getItem('pseudo') ?? '')
  const [roomId] = useState(() => localStorage.getItem('roomId') ?? '')

  const [role, setRole] = useState<PlayerRole | null>(null)
  const [gameState, setGameState] = useState<PublicGameState | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<PlayerChoice | null>(null)
  const [roundResult, setRoundResult] = useState<string>('')
  const [gameResult, setGameResult] = useState<string>('')

  useEffect(() => {
    if (!pseudo || !roomId) {
      navigate('/')
      return
    }

    const handleConnect = () => {
      console.log('socket connected', socket.id)
    }

    const handleRoomMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    }

    const handleRoomError = (data: { message: string }) => {
      setRoomError(data.message)
    }

    const handleRoomJoined = (data: { roomId: string; role: PlayerRole | null }) => {
      console.log('room joined:', data.roomId, 'role:', data.role)
      setRole(data.role)
      setRoomError(null)
    }

    const handleGameState = (data: PublicGameState) => {
      setGameState(data)
    }

    const handleGameStarted = (data: PublicGameState) => {
      setGameState(data)
      setRoundResult('')
      setGameResult('')
      setSelectedChoice(null)
    }

    const handleRoundStarted = (data: PublicGameState) => {
      setGameState(data)
      setRoundResult('')
      setSelectedChoice(null)
    }

    const handleChoiceReceived = () => {
      setGameState((prev) => {
        if (!prev?.game?.currentRound) return prev
        return { ...prev }
      })
    }

    const handleRoundResolved = (data: { winner: Winner; game: Game }) => {
      setGameState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          game: data.game,
        }
      })

      if (data.winner === 'egalite') {
        setRoundResult('Égalité sur cette manche.')
      } else if (data.winner === role) {
        setRoundResult('Tu as gagné cette manche.')
      } else {
        setRoundResult('Tu as perdu cette manche.')
      }
    }

    const handleGameFinished = (data: { game: Game }) => {
      setGameState((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          game: data.game,
        }
      })

      if (data.game.winner === role) {
        setGameResult('Tu as gagné la partie.')
      } else {
        setGameResult('Tu as perdu la partie.')
      }
    }

    socket.on('connect', handleConnect)
    socket.on('room:message', handleRoomMessage)
    socket.on('room:error', handleRoomError)
    socket.on('room:joined', handleRoomJoined)
    socket.on('game:state', handleGameState)
    socket.on('game:started', handleGameStarted)
    socket.on('game:round_started', handleRoundStarted)
    socket.on('game:choice_received', handleChoiceReceived)
    socket.on('game:round_resolved', handleRoundResolved)
    socket.on('game:finished', handleGameFinished)

    socket.emit('room:join', { roomId, author: pseudo })

    return () => {
      socket.emit('room:leave', { roomId, author: pseudo })

      socket.off('connect', handleConnect)
      socket.off('room:message', handleRoomMessage)
      socket.off('room:error', handleRoomError)
      socket.off('room:joined', handleRoomJoined)
      socket.off('game:state', handleGameState)
      socket.off('game:started', handleGameStarted)
      socket.off('game:round_started', handleRoundStarted)
      socket.off('game:choice_received', handleChoiceReceived)
      socket.off('game:round_resolved', handleRoundResolved)
      socket.off('game:finished', handleGameFinished)
    }
  }, [navigate, pseudo, roomId, role])

  const handleSend = () => {
    if (!input.trim() || !roomId) return

    socket.emit('room:message', {
      room: roomId,
      message: input,
      author: pseudo,
    })

    setInput('')
  }

  const handlePlayChoice = (choice: PlayerChoice) => {
    if (!roomId) return
    if (!gameState?.game) return
    if (gameState.game.status === 'finished') return

    setSelectedChoice(choice)
    setRoomError(null)

    socket.emit('game:choice', {
      roomId,
      choice,
    })
  }

  const currentRound = gameState?.game?.currentRound ?? null

  const myChoice = useMemo(() => {
    if (!currentRound || !role) return null
    return role === 'player1' ? currentRound.player1Choice : currentRound.player2Choice
  }, [currentRound, role])

  const opponentChoice = useMemo(() => {
    if (!currentRound || !role) return null
    return role === 'player1' ? currentRound.player2Choice : currentRound.player1Choice
  }, [currentRound, role])

  const canPlay =
    !!gameState?.game &&
    gameState.game.status === 'in_progress' &&
    !!currentRound &&
    currentRound.status === 'waiting_for_choices' &&
    myChoice === null

  const player1Name = gameState?.players.player1.author ?? 'Joueur 1'
  const player2Name = gameState?.players.player2.author ?? 'Joueur 2'

  return (
    <>
      <Navbar />

      <main className="page chat-page">
        <header className="hero-header">
          <h1>JEU: PIERRE — FEUILLE — CISEAUX</h1>
          <h2>Affronte un adversaire en temps réel</h2>
          <h3># PFC</h3>
          <p className="chat-room-name">Room : {roomId}</p>
          <p className="chat-room-name">Pseudo : {pseudo}</p>
          <p className="chat-room-name">
            Rôle : {role ? role : 'en attente'}
          </p>
        </header>

        <section className="chat-layout">
          <section className="panel panel--game">
            <div className="panel__head">
              <div>
                <h4>Table de jeu</h4>
                <p>
                  {gameState?.game
                    ? 'La partie est synchronisée avec le serveur.'
                    : 'En attente de deux joueurs pour démarrer la partie.'}
                </p>
              </div>

              <button className="btn btn--ghost" type="button" disabled>
                {gameState?.game ? 'PARTIE ACTIVE' : 'EN ATTENTE'}
              </button>
            </div>

            <div className="game-play">
              <div className="game-info">
                <p>
                  <strong>{player1Name}</strong> : {gameState?.game?.score.player1 ?? 0}
                </p>
                <p>
                  <strong>{player2Name}</strong> : {gameState?.game?.score.player2 ?? 0}
                </p>
                <p>
                  Manches jouées : {gameState?.game?.roundsPlayed ?? 0}
                </p>
                <p>
                  Minimum : {gameState?.game?.minimumRounds ?? '-'}
                </p>
              </div>

              <div className="choices">
                <button
                  className={`btn btn--choice ${selectedChoice === 'pierre' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => handlePlayChoice('pierre')}
                  disabled={!canPlay}
                >
                  Pierre
                </button>

                <button
                  className={`btn btn--choice ${selectedChoice === 'feuille' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => handlePlayChoice('feuille')}
                  disabled={!canPlay}
                >
                  Feuille
                </button>

                <button
                  className={`btn btn--choice ${selectedChoice === 'ciseaux' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => handlePlayChoice('ciseaux')}
                  disabled={!canPlay}
                >
                  Ciseaux
                </button>
              </div>

              <div className="game-placeholder">
                {!gameState?.game && <p>En attente d’un second joueur.</p>}

                {gameState?.game && currentRound && (
                  <>
                    <p>
                      Statut de manche : <strong>{currentRound.status}</strong>
                    </p>
                    <p>
                      Ton choix : <strong>{myChoice ?? 'pas encore joué'}</strong>
                    </p>
                    <p>
                      Choix adverse :{' '}
                      <strong>
                        {currentRound.status === 'resolved'
                          ? opponentChoice ?? 'aucun'
                          : opponentChoice
                          ? 'choix reçu'
                          : 'en attente'}
                      </strong>
                    </p>
                  </>
                )}

                {roundResult && (
                  <p className="game-result">
                    <strong>{roundResult}</strong>
                  </p>
                )}

                {gameResult && (
                  <p className="game-result-final">
                    <strong>{gameResult}</strong>
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="panel panel--chat">
            <div className="panel__head">
              <div>
                <h4>Historique & Chat</h4>
                <p>Suivi des manches et discussion avec les joueurs.</p>
              </div>
            </div>

            {roomError && <p className="room-error">{roomError}</p>}

            <div className="chat-box">
              {messages.length === 0 && <p className="muted">Aucun message</p>}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`chat-message ${m.author === 'Système' ? 'chat-message--system' : ''}`}
                >
                  <div className="chat-message__time">
                    <strong>{m.time}</strong>
                  </div>

                  <div className="chat-message__body">
                    {m.author === 'Système' ? (
                      <div className="chat-message__system">{m.text}</div>
                    ) : (
                      <>
                        <span className="chat-message__author">{m.author ?? 'Anonyme'}</span>
                        <span className="chat-message__sep">: </span>
                        <span className="chat-message__text">{m.text}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input">
              <label className="label" htmlFor="message">
                Message
              </label>

              <div className="input-row">
                <input
                  id="message"
                  className="input"
                  type="text"
                  placeholder="Ton message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend()
                  }}
                />

                <button className="btn" type="button" onClick={handleSend}>
                  Envoyer
                </button>
              </div>
            </div>
          </section>
        </section>
      </main>

      <footer>
        <p>© 2024 PFC - Tous droits réservés</p>
      </footer>
    </>
  )
}

export default ChatPage