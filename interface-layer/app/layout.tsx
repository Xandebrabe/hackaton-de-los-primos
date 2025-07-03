import type { Metadata } from 'next'
import { WalletProvider } from '@/contexts/wallet-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'M33T - Web3 Events Platform',
  description: 'Decentralized event management platform on Solana',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
