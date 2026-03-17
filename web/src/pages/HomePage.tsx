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

  // SOCKET
  useEffect(() => {
    const handleRoomsList = (roomsList: RoomStatus[]) => {
      console.log('ROOMS REÇUES FRONT:', roomsList)
      setRooms(roomsList)
    }
    socket.on('rooms:list', handleRoomsList)
    socket.emit('rooms:list')
    return () => {
      socket.off('rooms:list', handleRoomsList)
    }
  }, [])

  // AUTO SELECT ROOM
  useEffect(() => {
    if (pseudoValidated && !roomId && rooms.length > 0) {
      const firstAvailableRoom = rooms.find((room) => room.status !== 'full')
      if (firstAvailableRoom) {
        setRoomId(firstAvailableRoom.roomId)
      }
    }
  }, [pseudoValidated, rooms, roomId])

  // VALIDATION PSEUDO
  const handleValidatePseudo = () => {
    const clean = pseudo.trim()
    if (!clean) {
      setRoomError('Tu dois entrer un pseudo.')
      return
    }
    setPseudo(clean)
    setPseudoValidated(true)
    setRoomError(null)
  }

  // CONTINUE
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

  return (
    <>
      <Navbar />

      <main className="page">
        <header className="hero-header">
          <h1>JEU: PIERRE — FEUILLE — CISEAUX</h1>
          <h2>Prêt·e à défier d'autres joueurs en temps réel ?</h2>
          <h3>Vise la victoire — #PFC</h3>
        </header>

        <section className="cards">
          <div className="card__info">
            <h4>Accès jeu</h4>
            <h5>Rejoignez une partie</h5>
            <p>Choisis un pseudo puis sélectionne une room existante pour entrer dans une partie.</p>

            <div className="buttons_infos">
              <ButtonInfo>JOUER SANS COMPTE</ButtonInfo>
              <ButtonInfo>TEMPS RÉEL</ButtonInfo>
              <ButtonInfo>MULTIJOUEUR</ButtonInfo>
              <ButtonInfo>CLASSEMENTS</ButtonInfo>
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
          <h3>ENTREE</h3>
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
            <>
              <h2 className="card_pseudo__title">Choisis une room</h2>

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
                  >
                    <span>{room.roomId}</span>
                    <span>{room.count}/2</span>
                    <span>
                      {room.status === 'empty' && 'Disponible'}
                      {room.status === 'waiting' && 'En attente'}
                      {room.status === 'full' && 'Complète'}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {roomError && <p className="room-error">{roomError}</p>}

          <Button onClick={handleContinue}>
            Continuer
          </Button>
        </section>
      </main>
    </>
  )
}

export default HomePage