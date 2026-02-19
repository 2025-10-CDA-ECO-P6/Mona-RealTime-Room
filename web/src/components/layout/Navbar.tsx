import './Navbar.scss';

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav__pro">
        <div className="nav__logo">
          <span className="nav__wave" />
          <span className="nav__wave nav__wave--small" />
        </div>
        <span className="nav__name">Musicbox</span>
      </div>

      <nav className="nav__menu">
        <a href="#">Rooms</a>
        <a href="#">Live</a>
        <a href="#">About</a>
      </nav>
    </header>
  );
}
