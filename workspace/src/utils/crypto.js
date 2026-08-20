const PBKDF2_ITERATIONS = 310000
const SALT_BYTES = 16
const IV_BYTES = 12
const OBFUSCATION_ROUNDS = 5
const VX_MAGIC = 'vx1'
const AES_MAGIC = 'v2'

function utf8Encode(str) {
  return new TextEncoder().encode(str)
}

function utf8Decode(bytes) {
  return new TextDecoder().decode(bytes)
}

function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function isValidUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/* =====================================================================
 * AES-256-GCM dengan passphrase (tab Encode/Decode)
 * Format payload: v2:<salt>:<iv>:<ciphertext>  (semua base64)
 * ===================================================================== */

async function deriveAesKey(passphrase, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    utf8Encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function aesEncrypt(url, passphrase) {
  const trimmed = url.trim()
  if (!trimmed) throw new Error('URL tidak boleh kosong.')
  if (!isValidUrl(trimmed)) throw new Error('Format URL tidak valid. Gunakan http:// atau https://')
  if (!passphrase) throw new Error('Passphrase wajib diisi untuk enkripsi AES.')
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveAesKey(passphrase, salt)
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    utf8Encode(trimmed)
  )
  const parts = [
    AES_MAGIC,
    bytesToBase64(salt),
    bytesToBase64(iv),
    bytesToBase64(new Uint8Array(cipher))
  ]
  return parts.join(':')
}

export async function aesDecrypt(payload, passphrase) {
  const trimmed = payload.trim()
  if (!trimmed) throw new Error('Payload tidak boleh kosong.')
  if (!passphrase) throw new Error('Passphrase wajib diisi untuk decode AES.')
  const parts = trimmed.split(':')
  if (parts.length !== 4 || parts[0] !== AES_MAGIC) {
    throw new Error('Format payload AES tidak valid.')
  }
  const salt = base64ToBytes(parts[1])
  const iv = base64ToBytes(parts[2])
  const data = base64ToBytes(parts[3])
  const key = await deriveAesKey(passphrase, salt)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return utf8Decode(plain)
}

/* =====================================================================
 * Obfuscation berlapis untuk Link Cloaker (tanpa passphrase)
 * Format payload: vx1:<masterKey>:<salt>:<rounds>:<data>
 * 5 ronde: shuffle deterministik + XOR dengan round key turunan SHA-256
 * ===================================================================== */

function makePrng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFrom(bytes) {
  let seed = 2166136261
  for (let i = 0; i < bytes.length; i++) {
    seed ^= bytes[i]
    seed = Math.imul(seed, 16777619)
  }
  return seed >>> 0
}

async function deriveRoundKey(masterKey, salt, round) {
  const material = new Uint8Array(masterKey.length + salt.length + 1)
  material.set(masterKey, 0)
  material.set(salt, masterKey.length)
  material[masterKey.length + salt.length] = round
  const digest = await crypto.subtle.digest('SHA-256', material)
  return new Uint8Array(digest)
}

function xorWith(bytes, key) {
  const out = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ key[i % key.length]
  }
  return out
}

function shuffle(bytes, key) {
  const arr = Array.from(bytes)
  const prng = makePrng(seedFrom(key))
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return new Uint8Array(arr)
}

function unshuffle(bytes, key) {
  const arr = Array.from(bytes)
  const prng = makePrng(seedFrom(key))
  const swaps = []
  for (let i = arr.length - 1; i > 0; i--) {
    swaps.push([i, Math.floor(prng() * (i + 1))])
  }
  for (let k = swaps.length - 1; k >= 0; k--) {
    const [i, j] = swaps[k]
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return new Uint8Array(arr)
}

export async function cloakObfuscate(url) {
  const trimmed = url.trim()
  if (!trimmed) throw new Error('URL tidak boleh kosong.')
  if (!isValidUrl(trimmed)) throw new Error('Format URL tidak valid. Gunakan http:// atau https://')
  const masterKey = crypto.getRandomValues(new Uint8Array(32))
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  let data = utf8Encode(trimmed)
  for (let round = 1; round <= OBFUSCATION_ROUNDS; round++) {
    const roundKey = await deriveRoundKey(masterKey, salt, round)
    data = shuffle(xorWith(data, roundKey), roundKey)
  }
  const header = [
    VX_MAGIC,
    bytesToBase64(masterKey),
    bytesToBase64(salt),
    String(OBFUSCATION_ROUNDS)
  ].join(':')
  return `${header}:${bytesToBase64(data)}`
}

export async function cloakDeobfuscate(payload) {
  const trimmed = payload.trim()
  if (!trimmed) throw new Error('Payload tidak boleh kosong.')
  const parts = trimmed.split(':')
  if (parts.length !== 5 || parts[0] !== VX_MAGIC) {
    throw new Error('Payload cloak tidak valid atau sudah rusak.')
  }
  const masterKey = base64ToBytes(parts[1])
  const salt = base64ToBytes(parts[2])
  const rounds = parseInt(parts[3], 10)
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 10) {
    throw new Error('Payload cloak tidak valid.')
  }
  let data = base64ToBytes(parts[4])
  for (let round = rounds; round >= 1; round--) {
    const roundKey = await deriveRoundKey(masterKey, salt, round)
    data = xorWith(unshuffle(data, roundKey), roundKey)
  }
  const decoded = utf8Decode(data)
  if (!isValidUrl(decoded)) {
    throw new Error('Hasil decode bukan URL yang valid.')
  }
  return decoded
}

/* Router untuk cloak redirect di halaman */
export async function decodePayload(payload) {
  if (payload.startsWith(`${AES_MAGIC}:`)) {
    throw new Error('Payload AES membutuhkan passphrase. Gunakan tab Decode di halaman utama.')
  }
  return cloakDeobfuscate(payload)
}

export function buildCloakUrl(payload) {
  const base = window.location.origin
  return `${base}/#/r/${encodeURIComponent(payload)}`
}

export function generatePassphrase() {
  const bytes = crypto.getRandomValues(new Uint8Array(9))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
