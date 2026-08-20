import React, { useState } from 'react'
import { cloakObfuscate, buildCloakUrl, isValidUrl } from '../utils/crypto.js'

function CopyButton({ text, label = 'Salin' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button className="btn btn-copy" onClick={handleCopy} disabled={!text}>
      {copied ? 'Tersalin!' : label}
    </button>
  )
}

export default function Cloaker() {
  const [url, setUrl] = useState('')
  const [cloak, setCloak] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    setError('')
    setCloak('')
    const value = url.trim()
    if (!value) {
      setError('Masukkan URL tujuan terlebih dahulu.')
      return
    }
    if (!isValidUrl(value)) {
      setError('Format URL tidak valid. Gunakan http:// atau https://')
      return
    }
    setBusy(true)
    try {
      const payload = await cloakObfuscate(value)
      setCloak(buildCloakUrl(payload))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setUrl('')
    setCloak('')
    setError('')
  }

  return (
    <div className="panel">
      <p className="hint">
        Link Cloaker membuat link yang terlihat polos, tapi saat dibuka langsung
        mengarahkan ke tujuan tanpa memperlihatkan alamat aslinya. Setiap link
        dibuat dengan kunci acak dan 5 ronde obfuscation, jadi hasilnya unik
        setiap kali dan jauh lebih sulit untuk direverse.
      </p>

      <label className="field-label">URL tujuan</label>
      <input
        className="input-area input-line"
        type="text"
        placeholder="https://contoh.com/halaman-tujuan"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <div className="row-actions">
        <button className="btn btn-primary" onClick={generate} disabled={busy}>
          {busy ? 'Memproses...' : 'Buat Link Cloak'}
        </button>
        <button className="btn btn-ghost" onClick={reset}>
          Reset
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {cloak && (
        <div className="output-box cloak-preview">
          <div className="cloak-mock">
            <span className="cloak-dot" />
            <span className="cloak-url">vellixao.app/#/r/••••••••••••••••••</span>
          </div>
          <div className="output-header">
            <span>Link Cloak-mu</span>
            <CopyButton text={cloak} label="Salin Link" />
          </div>
          <code className="output-text">{cloak}</code>
          <a className="btn btn-open" href={cloak} target="_blank" rel="noopener noreferrer">
            Coba Buka Cloak
          </a>
        </div>
      )}

      <div className="steps">
        <h3>Cara kerja</h3>
        <ol>
          <li>Masukkan URL tujuan di atas.</li>
          <li>Klik "Buat Link Cloak" — URL kamu diobfuscate dengan 5 ronde shuffle + XOR.</li>
          <li>Bagikan link cloak. Tujuan asli tetap tersembunyi di balik hash.</li>
          <li>Saat dibuka, pengunjung otomatis dialihkan tanpa melihat URL asli.</li>
        </ol>
        <p className="note">
          Catatan: karena link cloak harus bisa dibuka siapa saja, kunci ikut
          tersimpan di dalam link. Ini dirancang untuk menyembunyikan tujuan dari
          penglihatan biasa, bukan untuk keamanan kriptografi penuh. Untuk
          kebutuhan rahasia sejati, gunakan tab Encode/Decode dengan passphrase.
        </p>
      </div>
    </div>
  )
}
