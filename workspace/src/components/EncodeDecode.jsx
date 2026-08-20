import React, { useEffect, useState } from 'react'
import {
  aesEncrypt,
  aesDecrypt,
  generatePassphrase
} from '../utils/crypto.js'

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

export default function EncodeDecode() {
  const [mode, setMode] = useState('encode')
  const [input, setInput] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('vellixao_history') || '[]')
      setHistory(saved)
    } catch {
      setHistory([])
    }
  }, [])

  const switchMode = (next) => {
    setMode(next)
    setOutput('')
    setError('')
  }

  const run = async () => {
    setError('')
    setOutput('')
    setBusy(true)
    try {
      if (mode === 'encode') {
        const result = await aesEncrypt(input, passphrase)
        setOutput(result)
        saveHistory({ type: 'encode', input: input.trim(), output: result })
      } else {
        const result = await aesDecrypt(input, passphrase)
        setOutput(result)
        saveHistory({ type: 'decode', input: input.trim(), output: result })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const saveHistory = (item) => {
    const next = [item, ...history].slice(0, 12)
    setHistory(next)
    try {
      localStorage.setItem('vellixao_history', JSON.stringify(next))
    } catch {
      /* storage penuh / privat, abaikan */
    }
  }

  const useHistory = (item) => {
    setMode(item.type)
    setInput(item.input)
    setOutput(item.output)
    setError('')
  }

  return (
    <div className="panel">
      <div className="seg">
        <button
          className={`seg-btn ${mode === 'encode' ? 'active' : ''}`}
          onClick={() => switchMode('encode')}
        >
          Encode URL
        </button>
        <button
          className={`seg-btn ${mode === 'decode' ? 'active' : ''}`}
          onClick={() => switchMode('decode')}
        >
          Decode Payload
        </button>
      </div>

      <label className="field-label">
        {mode === 'encode' ? 'Masukkan URL yang mau disembunyikan' : 'Tempel teks payload'}
      </label>
      <textarea
        className="input-area"
        placeholder={
          mode === 'encode'
            ? 'https://contoh.com/tautan-rahasia'
            : 'Tempel hasil encode (v2:...) di sini...'
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
      />

      <label className="field-label">
        Passphrase (wajib, dipakai untuk enkripsi &amp; dekripsi)
      </label>
      <div className="pass-row">
        <input
          className="input-area input-line pass-input"
          type="password"
          placeholder="Kunci rahasiamu..."
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
        <button
          className="btn btn-ghost"
          onClick={() => setPassphrase(generatePassphrase())}
          title="Buat passphrase acak"
        >
          Acak
        </button>
      </div>

      <button className="btn btn-primary" onClick={run} disabled={busy}>
        {busy ? 'Memproses...' : mode === 'encode' ? 'Enkripsi & Obfuscate' : 'Decode Payload'}
      </button>

      {error && <p className="error">{error}</p>}

      {output && (
        <div className="output-box">
          <div className="output-header">
            <span>Hasil</span>
            <CopyButton text={output} />
          </div>
          <code className="output-text">{output}</code>
          {mode === 'decode' && (
            <a className="btn btn-open" href={output} target="_blank" rel="noopener noreferrer">
              Buka Link
            </a>
          )}
          {mode === 'encode' && (
            <p className="note">
              Simpan passphrase-mu baik-baik. Payload hanya bisa didecode dengan passphrase yang sama.
            </p>
          )}
        </div>
      )}

      <div className="steps">
        <h3>Tingkat keamanan</h3>
        <ul className="security-list">
          <li>AES-256-GCM — standar enkripsi simetris yang dipakai industri.</li>
          <li>Kunci diturunkan dari passphrase via PBKDF2 (310.000 iterasi SHA-256).</li>
          <li>Salt &amp; IV acak setiap kali, sehingga payload yang sama menghasilkan output berbeda.</li>
          <li>Tanpa passphrase yang benar, payload praktis mustahil didecrypt.</li>
        </ul>
      </div>

      {history.length > 0 && (
        <div className="history">
          <h3>Riwayat Terbaru</h3>
          <ul>
            {history.map((item, i) => (
              <li key={i}>
                <button onClick={() => useHistory(item)} title={item.input}>
                  <span className={`h-type ${item.type}`}>{item.type === 'encode' ? 'ENC' : 'DEC'}</span>
                  <span className="h-value">{item.input}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
