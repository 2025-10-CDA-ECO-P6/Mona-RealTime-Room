import './styles/main.scss'
import Button from './components/ui/Button';
import Navbar from './components/layout/Navbar';
import imgHome from '../public/img-home.jpg';
import ButtonInfo from './components/ui/ButtonInfo';

function App() {
  return (
    <>
      <Navbar />

      <main className="page">
        <header className="hero-header">
          <h1>LE COWORKING SOCIAL EN MUSIQUE</h1>
          <h2>MOINS D'ISOLEMENT, PLUS D'ELAN</h2>
          <h3># MUSICBOX</h3>
        </header>

        <section className="cards">
          <div className="card__info">
            <h4>Accès musique</h4>
            <h5>Rejoignez une room</h5>
            <p>Entrez le nom de la room que vous souhaitez rejoindre ou créer une nouvelle room.</p>
            <div className="buttons_infos">
              <ButtonInfo>SANS COMPTE</ButtonInfo>
              <ButtonInfo>TEMPS REEL</ButtonInfo>
              <ButtonInfo>PLAYLIST PARTAGEE</ButtonInfo>
              <ButtonInfo>CONNEXION INSTANTANEE</ButtonInfo>
            </div>
          </div>

          <div className="card__img">
            <h6 className="card__img-label">
              <span className="live-dot" />
              ROOMS LIVE - TEMPS REEL
            </h6>
            <img className="imghome" src={imgHome} alt="Room Live" />
          </div>
        </section>

        <section className="card_pseudo">
          <h3>ENTREE</h3>
          <h2 className='card_pseudo__title'>Choisis ton pseudo pour continuer</h2>
          <p>Pseudo :</p>
          <input
            type="text"
            name="pseudo"
            id="pseudo-input"
            placeholder="Ex : Aurora"
          />
          <Button>Continuer</Button>
        </section>
      </main>

      <footer>
        <p>© 2024 MusicBox - Tous droits réservés</p>
      </footer>
    </>
  )
}

export default App