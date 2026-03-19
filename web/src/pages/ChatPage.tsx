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
  const [now, setNow] = useState(Date.now())

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
      setRole(data.role)
      setRoomError(null)
    }

    const handleGameState = (data: PublicGameState) => {
      setGameState(data)
    }

    const handleGameStarted = (data: PublicGameState) => {
      setGameState(data)
      setSelectedChoice(null)
      setRoomError(null)
    }

    const handleRoundStarted = (data: PublicGameState) => {
      setGameState(data)
      setSelectedChoice(null)
      setRoomError(null)
    }

    const handleChoiceReceived = () => {
      setGameState((prev) => (prev ? { ...prev } : prev))
    }

    const handleRoundResolved = (data: { winner: Winner; game: Game }) => {
      setGameState((prev) => {
        if (!prev) return prev
        return { ...prev, game: data.game }
      })
    }

    const handleGameFinished = (data: { game: Game }) => {
      setGameState((prev) => {
        if (!prev) return prev
        return { ...prev, game: data.game }
      })
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
  }, [navigate, pseudo, roomId])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleSend = () => {
    if (!input.trim() || !roomId) return

    socket.emit('room:message', {
      room: roomId,
      message: input.trim(),
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

  const game = gameState?.game ?? null
  const currentRound = game?.currentRound ?? null

  const player1Name = gameState?.players.player1.author ?? 'Joueur 1'
  const player2Name = gameState?.players.player2.author ?? 'Joueur 2'

  const myChoice = useMemo(() => {
    if (!currentRound || !role) return null
    return role === 'player1' ? currentRound.player1Choice : currentRound.player2Choice
  }, [currentRound, role])

  const opponentChoice = useMemo(() => {
    if (!currentRound || !role) return null
    return role === 'player1' ? currentRound.player2Choice : currentRound.player1Choice
  }, [currentRound, role])

  const canPlay =
    !!game &&
    game.status === 'in_progress' &&
    !!currentRound &&
    currentRound.status === 'waiting_for_choices' &&
    myChoice === null

  const roundResult = useMemo(() => {
    if (!currentRound || currentRound.status !== 'resolved' || !currentRound.winner || !role) {
      return ''
    }

    if (currentRound.winner === 'egalite') {
      return 'Égalité sur cette manche.'
    }

    return currentRound.winner === role
      ? 'Tu as gagné cette manche.'
      : 'Tu as perdu cette manche.'
  }, [currentRound, role])

  const gameResult = useMemo(() => {
    if (!game || game.status !== 'finished' || !game.winner || !role) return ''

    return game.winner === role
      ? 'Tu as gagné la partie.'
      : 'Tu as perdu la partie.'
  }, [game, role])

  const roundTimeLeft = useMemo(() => {
    if (!currentRound || currentRound.status !== 'waiting_for_choices') return null
    return Math.max(0, Math.ceil((currentRound.deadlineAt - now) / 1000))
  }, [currentRound, now])

  const gameStatusLabel = useMemo(() => {
    if (!game) return 'En attente'
    if (game.status === 'finished') return 'Terminée'
    return 'En cours'
  }, [game])

  const myPlayerName = role === 'player1' ? player1Name : role === 'player2' ? player2Name : pseudo
  const opponentName = role === 'player1' ? player2Name : player1Name

  const myScore =
    role === 'player1'
      ? game?.score.player1 ?? 0
      : role === 'player2'
        ? game?.score.player2 ?? 0
        : 0

  const opponentScore =
    role === 'player1'
      ? game?.score.player2 ?? 0
      : role === 'player2'
        ? game?.score.player1 ?? 0
        : 0

  const waitingForOpponent =
    !gameState?.players.player1.socketId || !gameState?.players.player2.socketId

  return (
    <>
      <Navbar />

      <main className="page chat-page">
        <section className="session-bar">
          <div className="session-bar__title">
            <h1>ShiFuMi</h1>
            <p>Partie multijoueur en temps réel</p>
          </div>

          <div className="session-bar__meta">
            <div className="session-chip">
              <span className="session-chip__label">Room</span>
              <strong>{roomId}</strong>
            </div>

            <div className="session-chip">
              <span className="session-chip__label">Pseudo</span>
              <strong>{pseudo}</strong>
            </div>

            <div className="session-chip">
              <span className="session-chip__label">Rôle</span>
              <strong>{role ?? 'en attente'}</strong>
            </div>

            <div className="session-chip">
              <span className="session-chip__label">Partie</span>
              <strong>{gameStatusLabel}</strong>
            </div>
          </div>
        </section>

        <section className="chat-layout">
          <section className="panel panel--game">
            <div className="panel__head panel__head--stack">
              <div>
                <h4>Table de jeu</h4>
                <p>État synchronisé avec le serveur.</p>
              </div>
            </div>

            <div className="game-top-info">
              <div className="game-top-info__item">
                <span>Manches</span>
                <strong>{game?.roundsPlayed ?? 0}</strong>
              </div>

              <div className="game-top-info__item">
                <span>Minimum</span>
                <strong>{game?.minimumRounds ?? '-'}</strong>
              </div>

              <div className="game-top-info__item">
                <span>Statut</span>
                <strong>{game?.status ?? 'en attente'}</strong>
              </div>

              <div className="game-top-info__item">
                <span>Manche</span>
                <strong>{currentRound?.status ?? 'aucune'}</strong>
              </div>

              <div className="game-top-info__item">
                <span>Temps</span>
                <strong>
                  {game && currentRound?.status === 'waiting_for_choices' && roundTimeLeft !== null
                    ? `${roundTimeLeft}s`
                    : '-'}
                </strong>
              </div>
            </div>

            <div className="game-status-strip">
              {waitingForOpponent && (
                <p className="game-status-strip__text">
                  En attente d’un second joueur.
                </p>
              )}

              {!waitingForOpponent && game && currentRound?.status === 'waiting_for_choices' && roundTimeLeft !== null && (
                <div className="game-status-strip__countdown">
                  <span>Temps restant</span>
                  <strong>{roundTimeLeft}s</strong>
                </div>
              )}

              {!waitingForOpponent && game && currentRound?.status === 'resolved' && (
                <div className="game-status-strip__result">
                  <strong>{roundResult}</strong>
                  {gameResult && <span>{gameResult}</span>}
                </div>
              )}

              {roomError && <p className="room-error">{roomError}</p>}
            </div>

            <div className="game-play">
              <div className="player-panel player-panel--me">
                <div className="player-info">
                  <div>
                    <strong>{myPlayerName || 'Toi'}</strong>
                    <p>Ton espace</p>
                  </div>
                  <span className="score">{myScore}</span>
                </div>

                <div className="player-img player-img--choice">
                  <span className="player-img__label">Choix actuel</span>
                  <strong>{myChoice ?? 'Pas encore joué'}</strong>
                </div>

                <div className="choice-grid">
                  <button
                    className={`choice-tile ${selectedChoice === 'pierre' ? 'choice-tile--active' : ''}`}
                    type="button"
                    onClick={() => handlePlayChoice('pierre')}
                    disabled={!canPlay}
                  >
                    <span className="choice-tile__title">Pierre</span>
                    <span className="choice-tile__desc">Solide et directe</span>
                  </button>

                  <button
                    className={`choice-tile ${selectedChoice === 'feuille' ? 'choice-tile--active' : ''}`}
                    type="button"
                    onClick={() => handlePlayChoice('feuille')}
                    disabled={!canPlay}
                  >
                    <span className="choice-tile__title">Feuille</span>
                    <span className="choice-tile__desc">Couvre la pierre</span>
                  </button>

                  <button
                    className={`choice-tile ${selectedChoice === 'ciseaux' ? 'choice-tile--active' : ''}`}
                    type="button"
                    onClick={() => handlePlayChoice('ciseaux')}
                    disabled={!canPlay}
                  >
                    <span className="choice-tile__title">Ciseaux</span>
                    <span className="choice-tile__desc">Tranche la feuille</span>
                  </button>
                </div>
              </div>

              <div className="opponent-panel">
                <div className="opponent-info">
                  <div>
                    <strong>{opponentName || 'Adversaire'}</strong>
                    <p>Adversaire</p>
                  </div>
                  <span className="opponent-choice">Score : {opponentScore}</span>
                </div>

                <div className="opponent-img opponent-img--choice">
                  <span className="player-img__label">Choix adverse</span>
                  <strong>
                    {currentRound?.status === 'resolved'
                      ? opponentChoice ?? 'Aucun choix'
                      : opponentChoice
                        ? 'Choix reçu'
                        : 'En attente'}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="panel panel--chat">
            <div className="panel__head">
              <div>
                <h4>Historique & Chat</h4>
                <p>Discussion et messages système.</p>
              </div>
            </div>

            <div className="chat-box">
              {messages.length === 0 && <p>Aucun message</p>}

              {messages.map((m, i) => (
                <div
                  key={`${m.time}-${i}`}
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

export default ChatPage;