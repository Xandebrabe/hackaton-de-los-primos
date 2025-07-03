"use client"

import type { ReactNode } from "react"
import { Calendar } from "lucide-react"

interface LoginLayoutProps {
  children: ReactNode
}

export function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col">
      <header className="bg-white shadow-sm border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <Calendar className="h-8 w-8 text-primary-600 mr-2" />
            <h1 className="text-2xl font-bold text-primary-900">M33T | Web3 Events</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex justify-center items-center px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
