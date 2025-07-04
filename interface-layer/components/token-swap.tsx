"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, RefreshCw, AlertCircle, CheckCircle, TrendingUp } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import {
  getSwapQuote,
  performSwap,
  calculateMinAmountOut,
  determineSwapDirection,
  SwapQuote
} from "@/lib/solana-utils"

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

export function TokenSwap() {
  const { session, isConnected } = useWallet()
  const [poolAddress, setPoolAddress] = useState('')
  const [tokenIn, setTokenIn] = useState('')
  const [tokenOut, setTokenOut] = useState(USDC_MINT) // Default to USDC
  const [amountIn, setAmountIn] = useState('')
  const [slippage, setSlippage] = useState(0.5) // 0.5% default slippage
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isLoadingQuote, setIsLoadingQuote] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Auto-refresh quote every 30 seconds if quote exists
  useEffect(() => {
    if (quote && poolAddress && tokenIn && tokenOut && amountIn) {
      const interval = setInterval(() => {
        handleGetQuote()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [quote, poolAddress, tokenIn, tokenOut, amountIn])

  const handleGetQuote = async () => {
    if (!poolAddress || !tokenIn || !tokenOut || !amountIn) {
      setError("Please fill in all fields")
      return
    }

    setIsLoadingQuote(true)
    setError(null)
    setQuote(null)

    try {
      // Convert amount to token units (assuming 6 decimals for now)
      const amountInTokenUnits = (parseFloat(amountIn) * 1e6).toString()

      // Determine swap direction (simplified - assumes tokenIn vs USDC)
      const swapDirection = tokenIn === USDC_MINT ? "tokenBToTokenA" : "tokenAToTokenB"

      const result = await getSwapQuote({
        poolAddress,
        tokenIn,
        tokenOut,
        amountIn: amountInTokenUnits,
        swapDirection
      })

      if (result.success && result.quote) {
        setQuote(result.quote)
      } else {
        setError(result.error || "Failed to get quote")
      }
    } catch (error) {
      setError("Error getting quote")
      console.error("Quote error:", error)
    } finally {
      setIsLoadingQuote(false)
    }
  }

  const handleSwap = async () => {
    if (!quote || !isConnected || !session?.publicKey) {
      setError("Please connect wallet and get a quote first")
      return
    }

    setIsSwapping(true)
    setError(null)
    setSuccess(null)

    try {
      const minAmountOut = calculateMinAmountOut(quote.amountOut, slippage)

      const swapResult = await performSwap({
        poolAddress: quote.poolAddress,
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        amountIn: quote.amountIn,
        minAmountOut,
        swapDirection: quote.swapDirection as "tokenAToTokenB" | "tokenBToTokenA"
      })

      if (swapResult.success && swapResult.signature) {
        setSuccess(`Swap completed successfully! Transaction: ${swapResult.signature}`)
        setQuote(null) // Clear quote after successful swap
        setAmountIn('') // Clear input
      } else {
        setError(swapResult.error || "Swap failed")
      }
    } catch (error) {
      setError("Error executing swap")
      console.error("Swap error:", error)
    } finally {
      setIsSwapping(false)
    }
  }

  const handleFlipTokens = () => {
    const tempTokenIn = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(tempTokenIn)
    setQuote(null) // Clear quote when flipping
  }

  const formatTokenAmount = (amount: string, decimals: number = 6) => {
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(6)
  }

  const formatPriceImpact = (impact: number) => {
    const color = impact > 5 ? "text-red-600" : impact > 1 ? "text-yellow-600" : "text-green-600"
    return <span className={color}>{impact.toFixed(3)}%</span>
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Token Swap
          </CardTitle>
          <CardDescription>
            Please connect your wallet to use token swapping
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Token Swap
          </CardTitle>
          <CardDescription>
            Swap tokens using Meteora DAMM v2 pools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="poolAddress">Pool Address</Label>
            <Input
              id="poolAddress"
              placeholder="Enter pool address..."
              value={poolAddress}
              onChange={(e) => setPoolAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tokenIn">Token In</Label>
              <Input
                id="tokenIn"
                placeholder="Token mint address..."
                value={tokenIn}
                onChange={(e) => setTokenIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokenOut">Token Out</Label>
              <Input
                id="tokenOut"
                placeholder="Token mint address..."
                value={tokenOut}
                onChange={(e) => setTokenOut(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFlipTokens}
              disabled={isLoadingQuote || isSwapping}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amountIn">Amount In</Label>
              <Input
                id="amountIn"
                type="number"
                placeholder="0.00"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slippage">Slippage (%)</Label>
              <Select value={slippage.toString()} onValueChange={(value) => setSlippage(parseFloat(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1%</SelectItem>
                  <SelectItem value="0.5">0.5%</SelectItem>
                  <SelectItem value="1.0">1.0%</SelectItem>
                  <SelectItem value="2.0">2.0%</SelectItem>
                  <SelectItem value="5.0">5.0%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGetQuote}
            disabled={isLoadingQuote || !poolAddress || !tokenIn || !tokenOut || !amountIn}
            className="w-full"
          >
            {isLoadingQuote ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Getting Quote...
              </>
            ) : (
              'Get Quote'
            )}
          </Button>

          {quote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Swap Quote</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Out:</span>
                    <span className="font-semibold">{formatTokenAmount(quote.amountOut)} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price Impact:</span>
                    {formatPriceImpact(quote.priceImpact)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span>{formatTokenAmount(quote.fee)} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Amount Out (with slippage):</span>
                    <span>{formatTokenAmount(calculateMinAmountOut(quote.amountOut, slippage))} tokens</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSwap}
            disabled={!quote || isSwapping || !isConnected}
            className="w-full"
            variant={quote ? "default" : "secondary"}
          >
            {isSwapping ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              'Execute Swap'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}