"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
  WalletSession,
  signInWithWallet,
  signOut,
  getCurrentSession,
  isAuthenticated,
  refreshSession
} from "@/lib/wallet-session"
import { getPhantomPublicKey } from "@/lib/solana-utils"

interface WalletContextType {
  // State
  session: WalletSession | null
  isConnected: boolean
  isLoading: boolean

  // Actions
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  refresh: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [session, setSession] = useState<WalletSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Derived state
  const isConnected = isAuthenticated() && !!session

  // Initialize session on mount
  useEffect(() => {
    initializeSession()
  }, [])

  // Check wallet connection periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshWalletSession()
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const initializeSession = async () => {
    setIsLoading(true)
    try {
      const currentSession = getCurrentSession()
      const walletPublicKey = getPhantomPublicKey()

      // If we have a session and wallet is connected, restore session
      if (currentSession && walletPublicKey && currentSession.publicKey === walletPublicKey) {
        setSession(currentSession)
      } else {
        // Clear invalid session
        setSession(null)
      }
    } catch (error) {
      console.error("Error initializing session:", error)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshWalletSession = async () => {
    try {
      const refreshedSession = await refreshSession()

      // Only update state if session changed
      if (refreshedSession?.publicKey !== session?.publicKey) {
        setSession(refreshedSession)
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      setSession(null)
    }
  }

  const connect = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithWallet()

      if (result.success && result.session) {
        setSession(result.session)
      } else {
        throw new Error(result.error || "Failed to connect wallet")
      }
    } catch (error) {
      console.error("Connection error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    setIsLoading(true)
    try {
      await signOut()
      setSession(null)
    } catch (error) {
      console.error("Disconnect error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = async () => {
    await refreshWalletSession()
  }

  const contextValue: WalletContextType = {
    session,
    isConnected,
    isLoading,
    connect,
    disconnect,
    refresh,
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}