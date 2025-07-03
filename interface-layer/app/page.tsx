"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { WalletConnect } from "@/components/wallet-connect"
import { LoginLayout } from "@/components/login-layout"
import { getPhantomPublicKey } from "@/lib/solana-utils"

export default function WalletLoginPage() {
  const router = useRouter()

  // Check if wallet is already connected and redirect to events
  useEffect(() => {
    const checkWalletConnection = () => {
      const publicKey = getPhantomPublicKey()
      if (publicKey) {
        router.push("/event-creation")
      }
    }

    checkWalletConnection()

    // Listen for wallet connection changes
    const interval = setInterval(checkWalletConnection, 1000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <LoginLayout>
      <div className="max-w-lg w-full bg-white/90 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-primary-300">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-primary-900">Welcome to M33T</h1>
          <p className="mt-2 text-primary-700 text-lg">Connect your Solana wallet to get started</p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <WalletConnect />
          </div>

          <div className="text-center">
            <p className="text-sm text-primary-600">
              By connecting your wallet, you can create and manage Web3 events,<br />
              and participate in the decentralized event ecosystem.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-primary-700">
            Don't have Phantom wallet?{" "}
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline font-medium"
            >
              Install Phantom
            </a>
          </p>
        </div>
      </div>
    </LoginLayout>
  )
}
