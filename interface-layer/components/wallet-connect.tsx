"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  connectPhantom,
  disconnectPhantom,
  isPhantomInstalled,
  getPhantomPublicKey
} from "@/lib/solana-utils"
import { Wallet, LogOut } from "lucide-react"

export function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = () => {
    const connectedKey = getPhantomPublicKey()
    setPublicKey(connectedKey)
    setIsConnected(!!connectedKey)
  }

  const handleConnect = async () => {
    if (!isPhantomInstalled()) {
      alert("Please install Phantom wallet first!")
      window.open("https://phantom.app/", "_blank")
      return
    }

    setIsLoading(true)
    try {
      const result = await connectPhantom()

      if (result.success && result.publicKey) {
        setPublicKey(result.publicKey)
        setIsConnected(true)
      } else {
        alert(result.error || "Failed to connect wallet")
      }
    } catch (error) {
      console.error("Connection error:", error)
      alert("Failed to connect wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectPhantom()
      setPublicKey(null)
      setIsConnected(false)
    } catch (error) {
      console.error("Disconnect error:", error)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-primary-50 px-3 py-2 rounded-lg">
          <Wallet className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">
            {formatAddress(publicKey)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="border-primary-300 text-primary-700 hover:bg-primary-50"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isLoading}
      className="bg-primary-600 hover:bg-primary-700 text-white"
    >
      <Wallet className="h-4 w-4 mr-2" />
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}