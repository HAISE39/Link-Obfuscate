import React from 'react'

export default function Hero() {
  return (
    <section className="hero" id="about">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-inner">
        <h1>
          Sembunyikan Linkmu.
          <br />
          <span className="gradient-text">Amankan Privasimu.</span>
        </h1>
        <p>
          VELLIXAO Link Obfuscate membantu kamu menyamarkan URL asli menjadi teks
          terenkripsi atau link cloak yang tidak menampilkan alamat tujuan.
        </p>
        <div className="hero-badges">
          <span className="badge">AES-256-GCM</span>
          <span className="badge">PBKDF2</span>
          <span className="badge">Client-Side</span>
          <span className="badge">100% Gratis</span>
        </div>
      </div>
    </section>
  )
}
