import React from 'react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>
          VELLIXAO Link Obfuscate &copy; {new Date().getFullYear()}
        </span>
        <span className="footer-note">
          Enkripsi berjalan sepenuhnya di browser kamu. Jangan gunakan untuk aktivitas ilegal.
        </span>
      </div>
    </footer>
  )
}
