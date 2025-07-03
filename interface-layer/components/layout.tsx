"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { WalletConnect } from "@/components/wallet-connect"
import { Plus, Calendar, Coins } from "lucide-react"

interface LayoutProps {
  children: ReactNode
  onCreateEvent: () => void
  onTestCreateToken: () => void
  isTestTokenLoading?: boolean
}

export function Layout({ children, onCreateEvent, onTestCreateToken, isTestTokenLoading = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <header className="bg-white shadow-sm border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-primary-900">M33T | Web3 Events</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button onClick={onCreateEvent} className="bg-primary-600 hover:bg-primary-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
              <Button
                onClick={onTestCreateToken}
                disabled={isTestTokenLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              >
                <Coins className="h-4 w-4 mr-2" />
                {isTestTokenLoading ? "Creating Token..." : "Test Create Token"}
              </Button>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
