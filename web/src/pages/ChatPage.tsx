import './ChatPage.scss'
import Navbar from '../components/layout/Navbar'

function ChatPage() {
  return (
    <>
      <Navbar />

      <main className="page chat-page">
        <header className="hero-header">
          <h1>JEU: PIERRE — FEUILLE — CISEAUX</h1>
          <h2>Affronte un adversaire en temps réel</h2>
          <h3># PFC</h3>
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
        <p>© 2024 PFC - Tous droits réservés</p>
      </footer>
    </>
  )
}

export default ChatPage