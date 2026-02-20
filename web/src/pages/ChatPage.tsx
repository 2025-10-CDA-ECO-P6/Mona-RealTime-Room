import './ChatPage.scss'
import Navbar from '../components/layout/Navbar'

function ChatPage() {
  return (
    <>
      <Navbar />

      <main className="page chat-page">
        <header className="hero-header">
          <h1>LE COWORKING SOCIAL EN MUSIQUE</h1>
          <h2>MOINS D'ISOLEMENT, PLUS D'ELAN</h2>
          <h3># MUSICBOX</h3>
        </header>

        <section className="chat-layout">
          <section className="panel panel--youtube">
            <div className="panel__head">
              <div>
                <h4>Scène YouTube</h4>
                <p>Partage un lien pour synchroniser l'écoute.</p>
              </div>
              <button className="btn btn--ghost" type="button">
                Synchroniser
              </button>
            </div>

            <div className="yt-player">
              <div className="yt-placeholder">
                Colle un lien YouTube pour lancer la musique en live.
              </div>
            </div>

            <div className="form-row">
              <label className="label" htmlFor="youtubeUrl">URL YouTube</label>
              <div className="input-row">
                <input
                  id="youtubeUrl"
                  className="input"
                  type="text"
                  placeholder="https://youtu.be/..."
                />
                <button className="btn" type="button">Partager</button>
              </div>
            </div>
          </section>

          <section className="panel panel--chat">
            <div className="panel__head">
              <div>
                <h4>Chat live</h4>
                <p>Discute en direct pendant l'écoute.</p>
              </div>
            </div>

            <div className="chat-box">
            </div>

            <div className="chat-input">
              <label className="label" htmlFor="message">Message</label>
              <div className="input-row">
                <input
                  id="message"
                  className="input"
                  type="text"
                  placeholder="Ton message..."
                />
                <button className="btn" type="button">Envoyer</button>
              </div>
            </div>
          </section>
        </section>
      </main>
      
      <footer>
        <p>© 2024 MusicBox - Tous droits réservés</p>
      </footer>
    </>
  )
}

export default ChatPage