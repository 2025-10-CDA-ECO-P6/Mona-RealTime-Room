import './styles/main.scss'
import Button from './components/ui/button';
import Navbar from './components/layout/Navbar';
import imgHome from '../public/img-home.jpg';

function App() {

  return (
    <>
      <Navbar />
      <header className="hero-header">
        <h1>LE COWORKING SOCIAL EN MUSIQUE</h1>
        <h2>MOINS D'ISOLEMENT, PLUS D'ELAN</h2>
        <h3># MUSICBOX</h3>
      </header>

      <section className='cards'>
        <div className='card__info'>
          <h4>Accès musique</h4>
          <h5>Rejoignez une room</h5>
          <p>Entrez le nom de la room que vous souhaitez rejoindre ou créer une nouvelle room.</p>
        </div>
          <div className='card__img'>
              <h6 className='card__img-label'>ROOMS LIVE - TEMPS REEL</h6>
              <img className="imghome" src={imgHome} alt="Room Live" />
          </div>
      </section>
                <Button>Continuer</Button>
    </>

  )
}

export default App
