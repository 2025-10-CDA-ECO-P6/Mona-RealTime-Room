import Button from '../components/ui/Button'
import Navbar from '../components/layout/Navbar'
import imgHome from '../assets/img-home.jpg'
import ButtonInfo from '../components/ui/ButtonInfo'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import socket from '../lib/socket'
import '../styles/main.scss'

type RoomStatus = {
  roomId: string
  count: number
  status: 'empty' | 'waiting' | 'full'
}

function HomePage() {
  const navigate = useNavigate()

  const [pseudo, setPseudo] = useState(() => {
    return localStorage.getItem('pseudo') ?? ''
  })
  const [pseudoValidated, setPseudoValidated] = useState(false)
  const [roomId, setRoomId] = useState(() => {
    return localStorage.getItem('roomId') ?? ''
  })
  const [rooms, setRooms] = useState<RoomStatus[]>([])
  const [roomError, setRoomError] = useState<string | null>(null)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)

  useEffect(() => {
    const handleRoomsList = (roomsList: RoomStatus[]) => {
      setRooms(roomsList)
    }

    socket.on('rooms:list', handleRoomsList)
    socket.emit('rooms:list')

    return () => {
      socket.off('rooms:list', handleRoomsList)
    }
  }, [])

  useEffect(() => {
    if (pseudoValidated && !roomId && rooms.length > 0) {
      const firstAvailableRoom = rooms.find((room) => room.status !== 'full')
      if (firstAvailableRoom) {
        setRoomId(firstAvailableRoom.roomId)
      }
    }
  }, [pseudoValidated, rooms, roomId])

  const handleValidatePseudo = () => {
    const clean = pseudo.trim()

    if (!clean) {
      setRoomError('Tu dois entrer un pseudo.')
      return
    }

    setPseudo(clean)
    setPseudoValidated(true)
    setRoomError(null)
    setIsRoomModalOpen(true)
  }

  const handleContinue = () => {
    if (!pseudoValidated) {
      setRoomError('Valide ton pseudo avant de continuer.')
      return
    }

    if (!roomId) {
      setRoomError('Tu dois choisir une room.')
      return
    }

    const selectedRoom = rooms.find((room) => room.roomId === roomId)

    if (!selectedRoom) {
      setRoomError('Cette room est introuvable.')
      return
    }

    if (selectedRoom.status === 'full') {
      setRoomError('Cette room est déjà pleine.')
      return
    }

    localStorage.setItem('pseudo', pseudo)
    localStorage.setItem('roomId', roomId)
    navigate('/chat')
  }

  const selectedRoomData = rooms.find((room) => room.roomId === roomId) ?? null

  return (
    <>
      <Navbar />

      <main className="page">
        <header className="hero-header">
          <h1>ShiFuMi</h1>
          <h2>Prêt·e à défier d'autres joueurs en temps réel ?</h2>
          <h3>Vise la victoire — #PFC</h3>
        </header>

        <section className="cards">
          <div className="card__info">
            <h4>Accès jeu</h4>
            <h5>Rejoignez une partie</h5>
            <p>Choisis un pseudo puis rejoins une room disponible pour entrer dans une partie.</p>

            <div className="buttons_infos">
              <ButtonInfo>JOUER SANS COMPTE</ButtonInfo>
              <ButtonInfo>TEMPS RÉEL</ButtonInfo>
              <ButtonInfo>MULTIJOUEUR</ButtonInfo>
              <ButtonInfo>PARTIES RAPIDES</ButtonInfo>
            </div>

            <div className="rules">
              <h5>Comment ça marche</h5>
              <ol>
                <li>Choisis ton pseudo</li>
                <li>Sélectionne une room</li>
                <li>Attends ton adversaire</li>
                <li>Joue en temps réel</li>
              </ol>
              <p>La partie démarre automatiquement dès que deux joueurs sont présents.</p>
            </div>
          </div>

          <div className="card__img">
            <h6 className="card__img-label">
              <span className="live-dot" />
              ROOMS LIVE - TEMPS REEL
            </h6>
            <img className="imghome" src={imgHome} alt="Partie Live" />
          </div>
        </section>

        <section className="card_pseudo">
          <h3>ENTRÉE</h3>
          <h2 className="card_pseudo__title">Choisis ton pseudo</h2>

          <input
            type="text"
            placeholder="Ex : Aurora"
            value={pseudo}
            onChange={(e) => {
              setPseudo(e.target.value)
              setPseudoValidated(false)
              setRoomError(null)
            }}
          />

          <Button onClick={handleValidatePseudo}>
            Valider le pseudo
          </Button>

          {pseudoValidated && (
            <div className="selected-room-box">
              <span className="selected-room-box__label">Room sélectionnée</span>
              <strong>{roomId || 'Aucune room sélectionnée'}</strong>

              {selectedRoomData && (
                <p>
                  {selectedRoomData.count}/2 •{' '}
                  {selectedRoomData.status === 'empty' && 'Disponible'}
                  {selectedRoomData.status === 'waiting' && 'En attente'}
                  {selectedRoomData.status === 'full' && 'Complète'}
                </p>
              )}

              <div className="selected-room-box__actions">
                <Button onClick={() => setIsRoomModalOpen(true)}>
                  Choisir une room
                </Button>
              </div>
            </div>
          )}

          {roomError && <p className="room-error">{roomError}</p>}

          <Button onClick={handleContinue}>
            Continuer
          </Button>
        </section>

        {isRoomModalOpen && (
          <div
            className="room-modal-overlay"
            onClick={() => setIsRoomModalOpen(false)}
          >
            <div
              className="room-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="room-modal__head">
                <div>
                  <h3>Choisis une room</h3>
                  <p>Les rooms complètes ne sont pas sélectionnables.</p>
                </div>

                <button
                  type="button"
                  className="room-modal__close"
                  onClick={() => setIsRoomModalOpen(false)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              <div className="rooms-grid">
                {rooms.length === 0 && (
                  <p className="room-empty">Chargement des rooms...</p>
                )}

                {rooms.map((room) => (
                  <button
                    key={room.roomId}
                    className={`room-card room-card--${room.status} ${roomId === room.roomId ? 'room-card--active' : ''}`}
                    onClick={() => {
                      setRoomId(room.roomId)
                      setRoomError(null)
                    }}
                    disabled={room.status === 'full'}
                    type="button"
                  >
                    <span className="room-card__title">{room.roomId}</span>
                    <span className="room-card__meta">{room.count}/2 joueurs</span>
                    <span className="room-card__status">
                      {room.status === 'empty' && 'Disponible'}
                      {room.status === 'waiting' && 'En attente'}
                      {room.status === 'full' && 'Complète'}
                    </span>
                  </button>
                ))}
              </div>

              <div className="room-modal__footer">
                <Button onClick={() => setIsRoomModalOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={() => setIsRoomModalOpen(false)}>
                  Confirmer la room
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

export default HomePage