import './ChatPage.scss'
import Navbar from '../components/layout/Navbar'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../lib/socket'

type ChatMessage = {
  text: string
  time: string
  date?: string
  author?: string
}

function ChatPage() {
  const navigate = useNavigate()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [roomError, setRoomError] = useState<string | null>(null)

  const [pseudo] = useState(() => {
    return localStorage.getItem('pseudo') ?? ''
  })

  const [roomId] = useState(() => {
    return localStorage.getItem('roomId') ?? ''
  })

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

    const handleRoomJoined = (data: { roomId: string }) => {
      console.log('room joined:', data.roomId)
      setRoomError(null)
    }

    socket.on('connect', handleConnect)
    socket.on('room:message', handleRoomMessage)
    socket.on('room:error', handleRoomError)
    socket.on('room:joined', handleRoomJoined)

    socket.emit('room:join', { roomId, author: pseudo })

    return () => {
      socket.emit('room:leave', { roomId, author: pseudo })
      socket.off('connect', handleConnect)
      socket.off('room:message', handleRoomMessage)
      socket.off('room:error', handleRoomError)
      socket.off('room:joined', handleRoomJoined)
    }
  }, [navigate, pseudo, roomId])

  const handleSend = () => {
    if (!input.trim() || !roomId) return

    socket.emit('room:message', {
      room: roomId,
      message: input,
      author: pseudo,
    })

    setInput('')
  }

  return (
    <>
      <Navbar />

      <main className="page chat-page">
        <header className="hero-header">
          <h1>JEU: PIERRE — FEUILLE — CISEAUX</h1>
          <h2>Affronte un adversaire en temps réel</h2>
          <h3># PFC</h3>
          <p className="chat-room-name">Room : {roomId}</p>
        </header>

        <section className="chat-layout">
          <section className="panel panel--game">
            <div className="panel__head">
              <div>
                <h4>Table de jeu</h4>
                <p>Choisis ton coup et lance la partie.</p>
              </div>

              <button className="btn btn--ghost" type="button">
                JOUER
              </button>
            </div>

            <div className="game-play">
              <div className="choices">
                <button className="btn btn--choice" type="button">Pierre</button>
                <button className="btn btn--choice" type="button">Feuille</button>
                <button className="btn btn--choice" type="button">Ciseaux</button>
              </div>
              <div className="game-placeholder">
                Sélectionne un coup pour voir le résultat.
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
              <label className="label" htmlFor="message">Message</label>
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