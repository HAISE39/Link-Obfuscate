import React from 'react'

export default function Navbar({ onNavigate }) {
  return (
    <header className="navbar">
      <div className="container nav-inner">
        <button className="brand" onClick={onNavigate}>
          <span className="brand-logo">V</span>
          <span className="brand-name">VELLIXAO</span>
          <span className="brand-tag">Link Obfuscate</span>
        </button>
        <nav className="nav-links">
          <a href="#encode">Encode</a>
          <a href="#cloak">Cloak</a>
          <a href="#about">Tentang</a>
        </nav>
      </div>
    </header>
  )
}
