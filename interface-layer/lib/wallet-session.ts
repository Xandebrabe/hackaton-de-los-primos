import { PublicKey } from "@solana/web3.js"
import {
  connectPhantom,
  disconnectPhantom,
  isPhantomInstalled,
  getPhantomPublicKey
} from "./solana-utils"

// Session storage keys
const SESSION_STORAGE_KEY = "wallet_session"
const JWT_STORAGE_KEY = "wallet_jwt"

export interface WalletSession {
  publicKey: string
  isAuthenticated: boolean
  jwt?: string
  connectedAt: string
  lastActivity: string
}

export interface SignInMessage {
  domain: string
  publicKey: string
  nonce: string
  statement: string
  issuedAt: string
}

/**
 * Generate a sign-in message for wallet authentication
 * TODO: Check if need to use nonce to avoid replay attack 
 */
export function createSignInMessage(publicKey: string): SignInMessage {
  const domain = typeof window !== "undefined" ? window.location.host : "localhost:3000"
  const nonce = Math.random().toString(36).substring(2, 15)
  const issuedAt = new Date().toISOString()

  return {
    domain,
    publicKey,
    nonce,
    statement: `Sign in to M33T Web3 Events Platform.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`,
    issuedAt,
  }
}

/**
 * Format the sign-in message for wallet signing
 */
export function formatSignInMessage(message: SignInMessage): string {
  return `${message.statement}\n\nDomain: ${message.domain}\nNonce: ${message.nonce}\nIssued At: ${message.issuedAt}`
}

/**
 * Sign in with wallet - connects and authenticates user
 */
export async function signInWithWallet(): Promise<{
  success: boolean
  session?: WalletSession
  error?: string
}> {
  try {
    // Step 1: Connect wallet
    const connectResult = await connectPhantom()
    if (!connectResult.success || !connectResult.publicKey) {
      return {
        success: false,
        error: connectResult.error || "Failed to connect wallet",
      }
    }

    // Step 2: Create session (simplified for hackathon)
    const session: WalletSession = {
      publicKey: connectResult.publicKey,
      isAuthenticated: true,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    }

    saveSession(session)

    return {
      success: true,
      session,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    }
  }
}

/**
 * Get current session from storage
 */
export function getCurrentSession(): WalletSession | null {
  if (typeof window === "undefined") return null

  try {
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!sessionData) return null

    const session: WalletSession = JSON.parse(sessionData)

    // Check if session is expired (24 hours)
    const connectedAt = new Date(session.connectedAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - connectedAt.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      clearSession()
      return null
    }

    // Update last activity
    session.lastActivity = new Date().toISOString()
    saveSession(session)

    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

/**
 * Save session to local storage
 */
export function saveSession(session: WalletSession): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    if (session.jwt) {
      localStorage.setItem(JWT_STORAGE_KEY, session.jwt)
    }
  } catch (error) {
    console.error("Error saving session:", error)
  }
}

/**
 * Clear current session
 */
export function clearSession(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(JWT_STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing session:", error)
  }
}

/**
 * Sign out - disconnect wallet and clear session
 */
export async function signOut(): Promise<void> {
  try {
    await disconnectPhantom()
    clearSession()
  } catch (error) {
    console.error("Error signing out:", error)
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const session = getCurrentSession()
  const walletConnected = getPhantomPublicKey()

  return !!(session?.isAuthenticated && walletConnected && session.publicKey === walletConnected)
}

/**
 * Get JWT token for API requests
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null

  try {
    return localStorage.getItem(JWT_STORAGE_KEY)
  } catch (error) {
    return null
  }
}

/**
 * Refresh session - check wallet connection and update session
 */
export async function refreshSession(): Promise<WalletSession | null> {
  const currentSession = getCurrentSession()
  const walletPublicKey = getPhantomPublicKey()

  // If no session or wallet disconnected, clear session
  if (!currentSession || !walletPublicKey || currentSession.publicKey !== walletPublicKey) {
    clearSession()
    return null
  }

  // Update last activity
  currentSession.lastActivity = new Date().toISOString()
  saveSession(currentSession)

  return currentSession
}
