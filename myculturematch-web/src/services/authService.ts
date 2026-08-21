import { useAppStore } from '@/src/stores/useAppStore'

const STORAGE_KEY = 'auth_token'
const SESSION_DURATION = 24 * 60 * 60 * 1000

interface StoredSession {
  token: string
  userId: string
  expiresAt: number
}

function generateToken(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: `user-${Date.now()}`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + SESSION_DURATION) / 1000),
    })
  )
  const signature = btoa(`${header}.${payload}.secret`)
  return `${header}.${payload}.${signature}`
}

function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return `hashed_${Math.abs(hash).toString(16)}_${password.length}`
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim()
}

export const authService = {
  getStoredSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as StoredSession
    } catch {
      return null
    }
  },

  restoreSession(): boolean {
    const session = this.getStoredSession()
    if (!session || Date.now() > session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
    const store = useAppStore.getState()
    store.setAuthenticated(true)
    store.setOnboarded(true)
    return true
  },

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    await new Promise((r) => setTimeout(r, 800))

    const stored = localStorage.getItem(`user_${sanitizeInput(email)}`)
    if (!stored) {
      return { success: false, error: 'Email ou mot de passe incorrect.' }
    }

    const userData = JSON.parse(stored)
    if (!verifyPassword(password, userData.passwordHash)) {
      return { success: false, error: 'Email ou mot de passe incorrect.' }
    }

    const token = generateToken()
    const session: StoredSession = {
      token,
      userId: userData.id,
      expiresAt: Date.now() + SESSION_DURATION,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))

    const store = useAppStore.getState()
    store.loginUser({
      name: userData.name,
      avatar: userData.avatar,
      location: userData.location,
    })

    return { success: true }
  },

  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> {
    await new Promise((r) => setTimeout(r, 800))

    const safeEmail = sanitizeInput(email)
    const existing = localStorage.getItem(`user_${safeEmail}`)
    if (existing) {
      return { success: false, error: 'Un compte existe déjà avec cet email.' }
    }

    if (password.length < 6) {
      return { success: false, error: 'Le mot de passe doit faire au moins 6 caractères.' }
    }

    const userData = {
      id: `user-${Date.now()}`,
      name: sanitizeInput(name),
      email: safeEmail,
      passwordHash: hashPassword(password),
      avatar: `https://api.dicebear.com/7.x/open-peeps/svg?seed=${sanitizeInput(name)}`,
      location: '',
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(`user_${safeEmail}`, JSON.stringify(userData))
    return { success: true }
  },

  signOut(): void {
    localStorage.removeItem(STORAGE_KEY)
    const store = useAppStore.getState()
    store.logout()
  },

  isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },
}
