"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Coins, ArrowRightLeft, RefreshCw } from 'lucide-react'
import { useWallet } from '@/contexts/wallet-context'
import { getSwapQuote, performSwap } from '@/lib/solana-utils'
import { useToast } from '@/hooks/use-toast'

interface EventToken {
  tokenId: number
  name: string
  symbol: string
  mintAddress: string
  poolAddress: string
  positionAddress: string
  createdAt: string
  transactionSignature: string | null
  eventId: string
}

interface EventTokensProps {
  eventId: string
}

const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

export default function EventTokens({ eventId }: EventTokensProps) {
  const [eventTokens, setEventTokens] = useState<EventToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [swapAmountUsdc, setSwapAmountUsdc] = useState("")
  const [isSwapping, setIsSwapping] = useState(false)
  const [selectedToken, setSelectedToken] = useState<EventToken | null>(null)

  const { session, isConnected } = useWallet()
  const { toast } = useToast()

  const fetchEventTokens = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${eventId}/tokens`)
      const data = await response.json()

      if (data.success) {
        setEventTokens(data.tokens)
        if (data.tokens.length > 0) {
          setSelectedToken(data.tokens[0]) // Auto-select first token
        }
      } else {
        setError(data.error || "Failed to fetch event tokens")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEventTokens()
  }, [eventId])

  const handleSwap = async () => {
    if (!selectedToken || !swapAmountUsdc || !isConnected || !session?.publicKey) {
      toast({
        title: "Error",
        description: "Please connect wallet and enter swap amount",
        variant: "destructive"
      })
      return
    }

    setIsSwapping(true)

    try {
      // Convert USDC amount to smallest unit (6 decimals)
      const usdcAmount = Math.floor(parseFloat(swapAmountUsdc) * 1e6).toString()

      // Get quote first
      const quoteResult = await getSwapQuote({
        poolAddress: selectedToken.poolAddress,
        tokenIn: USDC_ADDRESS,
        tokenOut: selectedToken.mintAddress,
        amountIn: usdcAmount
      })

      if (!quoteResult.success || !quoteResult.quote) {
        throw new Error(quoteResult.error || "Failed to get swap quote")
      }

      // Calculate minimum amount out with 1% slippage
      const minAmountOut = (BigInt(quoteResult.quote.amountOut) * BigInt(99) / BigInt(100)).toString()

      // Execute swap
      const swapResult = await performSwap({
        poolAddress: selectedToken.poolAddress,
        tokenIn: USDC_ADDRESS,
        tokenOut: selectedToken.mintAddress,
        amountIn: usdcAmount,
        minAmountOut: minAmountOut,
        swapDirection: "tokenBToTokenA"
      })

      if (swapResult.success && swapResult.signature) {
        toast({
          title: "Swap Successful!",
          description: `Swapped ${swapAmountUsdc} USDC for ${selectedToken.symbol}`,
        })
        setSwapAmountUsdc("")
      } else {
        throw new Error(swapResult.error || "Swap failed")
      }

    } catch (error) {
      console.error("Swap error:", error)
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSwapping(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Event Tokens
          </CardTitle>
          <CardDescription>Loading event tokens...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Event Tokens
          </CardTitle>
          <CardDescription>Error loading tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 p-4 text-center">
            <p>{error}</p>
            <Button onClick={fetchEventTokens} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (eventTokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Event Tokens
          </CardTitle>
          <CardDescription>No tokens available for this event</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-4">
            This event doesn't have any tokens yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Event Tokens ({eventTokens.length})
        </CardTitle>
        <CardDescription>
          Swap USDC for event tokens to get exclusive access and perks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Selection */}
        <div>
          <h4 className="font-medium mb-2">Available Tokens:</h4>
          <div className="grid grid-cols-1 gap-2">
            {eventTokens.map((token) => (
              <div
                key={token.tokenId}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedToken?.tokenId === token.tokenId
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedToken(token)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{token.name}</span>
                      <Badge variant="secondary">{token.symbol}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(token.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedToken?.tokenId === token.tokenId && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Swap Interface */}
        {selectedToken && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Swap to {selectedToken.symbol}
            </h4>

            {!isConnected ? (
              <p className="text-gray-500 text-center py-4">
                Connect your wallet to swap tokens
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    USDC Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={swapAmountUsdc}
                    onChange={(e) => setSwapAmountUsdc(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the amount of USDC you want to swap
                  </p>
                </div>

                <Button
                  onClick={handleSwap}
                  disabled={!swapAmountUsdc || isSwapping || parseFloat(swapAmountUsdc) <= 0}
                  className="w-full"
                >
                  {isSwapping ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Swapping...
                    </>
                  ) : (
                    `Swap ${swapAmountUsdc || '0'} USDC → ${selectedToken.symbol}`
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Swapping gives you access to exclusive event perks and voting rights
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}