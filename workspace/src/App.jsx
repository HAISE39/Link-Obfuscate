import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import EncodeDecode from './components/EncodeDecode.jsx'
import Cloaker from './components/Cloaker.jsx'
import Footer from './components/Footer.jsx'
import { decodePayload } from './utils/crypto.js'

export default function App() {
  const [activeTab, setActiveTab] = useState('encode')

  useEffect(() => {
    const hash = window.location.hash
    const match = hash.match(/^#\/r\/(.+)$/)
    if (match) {
      const redirect = document.getElementById('cloak-redirect')
      decodePayload(decodeURIComponent(match[1]))
        .then((target) => {
          if (redirect) {
            redirect.innerHTML = `<p>Mengalihkan ke <strong>${target}</strong>...</p>`
          }
          setTimeout(() => {
            window.location.replace(target)
          }, 700)
        })
        .catch(() => {
          if (redirect) {
            redirect.innerHTML = '<p>Link tidak valid atau sudah rusak.</p>'
          }
        })
    }
  }, [])

  if (window.location.hash.match(/^#\/r\//)) {
    return (
      <div className="cloak-screen" id="cloak-redirect">
        <p>Memeriksa link...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar onNavigate={() => setActiveTab('encode')} />
      <Hero />
      <main className="container">
        <div className="tabs" role="tablist">
          <button
            className={`tab ${activeTab === 'encode' ? 'active' : ''}`}
            onClick={() => setActiveTab('encode')}
            role="tab"
          >
            Encode / Decode URL
          </button>
          <button
            className={`tab ${activeTab === 'cloak' ? 'active' : ''}`}
            onClick={() => setActiveTab('cloak')}
            role="tab"
          >
            Link Cloaker
          </button>
        </div>

        {activeTab === 'encode' ? <EncodeDecode /> : <Cloaker />}
      </main>
      <Footer />
    </div>
  )
}
