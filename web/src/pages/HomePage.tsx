import Button from '../components/ui/Button'
import Navbar from '../components/layout/Navbar'
import imgHome from '../assets/img-home.jpg'
import ButtonInfo from '../components/ui/ButtonInfo'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import '../styles/main.scss'

function HomePage() {
  const navigate = useNavigate()
  const [pseudo, setPseudo] = useState(() => {
    return localStorage.getItem('pseudo') ?? ''
  })

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
            <p>Entrez le nom de la partie que vous souhaitez rejoindre ou créez-en une nouvelle.</p>
            <div className="buttons_infos">
              <ButtonInfo>JOUER SANS COMPTE</ButtonInfo>
              <ButtonInfo>TEMPS RÉEL</ButtonInfo>
              <ButtonInfo>MULTIJOUEUR</ButtonInfo>
              <ButtonInfo>CLASSEMENTS</ButtonInfo>
            </div>

            <div className="rules">
              <h5>Règles du jeu</h5>
              <ol>
                <li>Pierre bat Ciseaux</li>
                <li>Ciseaux bat Feuille</li>
                <li>Feuille bat Pierre</li>
              </ol>
              <p>Chaque manche: choisissez un coup simultanément. Première personne à 3 manches gagne la partie.</p>
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
          <h2 className="card_pseudo__title">Choisis ton pseudo pour continuer</h2>
          <p>Pseudo :</p>
          <input
            type="text"
            name="pseudo"
            id="pseudo-input"
            placeholder="Ex : Aurora"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
          />
          <Button
            onClick={() => {
              if (!pseudo.trim()) return
              localStorage.setItem('pseudo', pseudo.trim())
              navigate('/chat')
            }}
          >
            Continuer
          </Button>
        </section>
      </main>

      <footer>
        <p>© 2024 PFC - Tous droits réservés</p>
      </footer>
    </>
  )
}

export default HomePage