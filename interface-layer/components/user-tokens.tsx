"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, ExternalLink } from 'lucide-react'
import { getUserTokens } from '@/lib/solana-utils'
import { useToast } from '@/hooks/use-toast'

interface UserTokensProps {
  userAddress: string
}

interface TokenBalance {
  tokenId: number
  name: string
  symbol: string
  mintAddress: string
  poolAddress: string
  positionAddress: string
  ataAddress: string | null
  balance: string
  balanceFormatted: string
  createdAt: string
  transactionSignature: string | null
  hasBalance: boolean
  error?: string
}

interface TokenData {
  success: boolean
  userAddress: string
  summary: {
    totalTokens: number
    tokensWithBalance: number
    tokensWithoutBalance: number
    totalBalanceValue: string
  }
  tokens: TokenBalance[]
}

export default function UserTokens({ userAddress }: UserTokensProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchTokens = async () => {
    if (!userAddress) return

    setLoading(true)
    setError(null)

    try {
      const result = await getUserTokens(userAddress)

      if (result.success && result.data) {
        setTokenData(result.data)
      } else {
        setError(result.error || "Failed to fetch tokens")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [userAddress])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tokens</CardTitle>
          <CardDescription>Loading token portfolio...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
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
          <CardTitle>My Tokens</CardTitle>
          <CardDescription>Error loading tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 p-4 text-center">
            <p>{error}</p>
            <Button onClick={fetchTokens} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tokenData || tokenData.tokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tokens</CardTitle>
          <CardDescription>No tokens found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            No tokens found in the system yet. Once tokens are created, you'll see your balances here!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>My Token Portfolio</CardTitle>
            <CardDescription>
              All tokens with my current balances
            </CardDescription>
          </div>
          <Button onClick={fetchTokens} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{tokenData.summary.totalTokens}</div>
              <div className="text-sm text-gray-500">Available Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tokenData.summary.tokensWithBalance}</div>
              <div className="text-sm text-gray-500">I Hold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{tokenData.summary.tokensWithoutBalance}</div>
              <div className="text-sm text-gray-500">I Don't Hold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{tokenData.summary.totalBalanceValue}</div>
              <div className="text-sm text-gray-500">Total Balance</div>
            </div>
          </div>

        {/* Token List */}
        <div className="space-y-4">
          {tokenData.tokens.map((token) => (
            <div key={token.tokenId} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{token.name}</h3>
                    <Badge variant="secondary">{token.symbol}</Badge>
                    {token.hasBalance ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {token.balanceFormatted}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        No Balance
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {formatDate(token.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mint Address:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {token.mintAddress.slice(0, 8)}...{token.mintAddress.slice(-8)}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(token.mintAddress, "Mint address")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Pool Address:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {token.poolAddress.slice(0, 8)}...{token.poolAddress.slice(-8)}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(token.poolAddress, "Pool address")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {token.ataAddress && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ATA Address:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {token.ataAddress.slice(0, 8)}...{token.ataAddress.slice(-8)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(token.ataAddress!, "ATA address")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {token.transactionSignature && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {token.transactionSignature.slice(0, 8)}...{token.transactionSignature.slice(-8)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(token.transactionSignature!, "Transaction signature")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`https://explorer.solana.com/tx/${token.transactionSignature}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {token.error && (
                  <div className="text-red-500 text-xs mt-2">
                    Error: {token.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}