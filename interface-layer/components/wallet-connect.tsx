"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { isPhantomInstalled } from "@/lib/solana-utils"
import { Wallet, LogOut } from "lucide-react"

export function WalletConnect() {
  const { session, isConnected, isLoading, connect, disconnect } = useWallet()

  const handleConnect = async () => {
    if (!isPhantomInstalled()) {
      alert("Please install Phantom wallet first!")
      window.open("https://phantom.app/", "_blank")
      return
    }

    try {
      await connect()
    } catch (error) {
      console.error("Connection error:", error)
      alert(error instanceof Error ? error.message : "Failed to connect wallet")
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error("Disconnect error:", error)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (isConnected && session?.publicKey) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-primary-50 px-3 py-2 rounded-lg">
          <Wallet className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">
            {formatAddress(session.publicKey)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={isLoading}
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