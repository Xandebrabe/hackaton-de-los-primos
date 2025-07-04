"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Coins, ArrowRightLeft, RefreshCw, Gift, Shirt, Ticket, Trophy } from 'lucide-react'
import { useWallet } from '@/contexts/wallet-context'
import { Progress } from '@/components/ui/progress'
import { getSwapQuote, performSwap } from '@/lib/solana-utils'
import { Connection, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"
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
  userBalance?: string
  userBalanceFormatted?: string
  hasBalance?: boolean
}

interface EventTokensProps {
  eventId: string
}

const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
  "confirmed"
)

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
        let tokensWithBalances = data.tokens

        // If user is connected, fetch their balances for each token
        if (isConnected && session?.publicKey) {
          tokensWithBalances = await Promise.all(
            data.tokens.map(async (token: EventToken) => {
              try {
                const userPublicKey = new PublicKey(session.publicKey!)
                const mintPublicKey = new PublicKey(token.mintAddress)
                const ataAddress = await getAssociatedTokenAddress(mintPublicKey, userPublicKey)

                // Try to get the user's ATA balance
                const ataAccount = await getAccount(connection, ataAddress)

                return {
                  ...token,
                  userBalance: ataAccount.amount.toString(),
                  userBalanceFormatted: (Number(ataAccount.amount) / 1e6).toFixed(6),
                  hasBalance: ataAccount.amount > BigInt(0)
                }
              } catch (error) {
                // ATA doesn't exist or other error - user has 0 balance
                return {
                  ...token,
                  userBalance: "0",
                  userBalanceFormatted: "0.000000",
                  hasBalance: false
                }
              }
            })
          )
        }

        setEventTokens(tokensWithBalances)
        if (tokensWithBalances.length > 0) {
          setSelectedToken(tokensWithBalances[0]) // Auto-select first token
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
  }, [eventId, isConnected, session?.publicKey])

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

        // Refresh token balances to show updated holdings
        fetchEventTokens()
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
        {/* User Holdings Summary */}
        {isConnected && eventTokens.length > 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-4 rounded-lg border">
            <h4 className="font-medium text-primary-900 mb-2">My Holdings Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-primary-700">
                  {eventTokens.reduce((sum, token) => sum + parseFloat(token.userBalanceFormatted || "0"), 0).toFixed(2)}
                </p>
                <p className="text-sm text-primary-600">Total Tokens</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-700">
                  {eventTokens.filter(t => t.hasBalance).length > 0 ? "✓" : "✗"}
                </p>
                <p className="text-sm text-primary-600">Token Holder</p>
              </div>
            </div>
            {eventTokens.some(t => t.hasBalance) && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                🎉 You have unlocked event perks! Check below for your exclusive access.
              </p>
            )}
          </div>
        )}

        {/* Event Perks */}
        {(() => {
          const totalTokens = eventTokens.reduce((sum, token) => sum + parseFloat(token.userBalanceFormatted || "0"), 0)
          const perks = [
            { name: "Event T-Shirt", tokens: 1, icon: Shirt, description: "Exclusive event merchandise" },
            { name: "Event Sneakers", tokens: 2, icon: Trophy, description: "Limited edition sneakers" },
            { name: "Next Year Tickets", tokens: 3, icon: Ticket, description: "Free tickets for next year's event" }
          ]

          return (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Event Perks & Rewards
              </h4>
              <div className="space-y-4">
                {perks.map((perk, index) => {
                  const isUnlocked = totalTokens >= perk.tokens
                  const progress = Math.min((totalTokens / perk.tokens) * 100, 100)
                  const Icon = perk.icon

                  return (
                    <div key={index} className={`p-3 rounded-lg border ${
                      isUnlocked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${isUnlocked ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className={`font-medium ${isUnlocked ? 'text-green-800' : 'text-gray-600'}`}>
                            {perk.name}
                          </span>
                          {isUnlocked && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                              Unlocked!
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
                          {perk.tokens} Token{perk.tokens > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{perk.description}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="flex-1" />
                        <span className="text-sm font-medium text-gray-700">
                          {totalTokens.toFixed(1)}/{perk.tokens}
                        </span>
                      </div>
                      {!isUnlocked && (
                        <p className="text-xs text-gray-500 mt-1">
                          Need {(perk.tokens - totalTokens).toFixed(1)} more token{(perk.tokens - totalTokens) > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Your Progress</span>
                  <span className="text-sm text-gray-600">
                    {perks.filter(p => totalTokens >= p.tokens).length} / {perks.length} Perks Unlocked
                  </span>
                </div>
                <Progress value={(perks.filter(p => totalTokens >= p.tokens).length / perks.length) * 100} className="mt-2" />
                {totalTokens === 0 && isConnected && (
                  <p className="text-sm text-gray-500 mt-2">
                    Start swapping to unlock exclusive perks!
                  </p>
                )}
              </div>
            </div>
          )
        })()}

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
                       {token.hasBalance && (
                         <Badge variant="default" className="bg-green-100 text-green-800">
                           {token.userBalanceFormatted}
                         </Badge>
                       )}
                     </div>
                     <p className="text-sm text-gray-500 mt-1">
                       Created: {new Date(token.createdAt).toLocaleDateString()}
                     </p>
                     {isConnected && (
                       <p className="text-sm font-medium mt-1">
                         My Balance: {token.userBalanceFormatted || "0.000000"} {token.symbol}
                       </p>
                     )}
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     {selectedToken?.tokenId === token.tokenId && (
                       <Badge variant="default">Selected</Badge>
                     )}
                     {token.hasBalance && (
                       <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                         Holder
                       </Badge>
                     )}
                   </div>
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