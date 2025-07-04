import { Connection, PublicKey, Transaction } from "@solana/web3.js"

// Phantom wallet interface
interface PhantomProvider {
  isPhantom: boolean
  publicKey: PublicKey | null
  isConnected: boolean
  connect(): Promise<{ publicKey: PublicKey }>
  disconnect(): Promise<void>
  signTransaction(transaction: Transaction): Promise<Transaction>
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>
}

// Extend Window interface for Phantom
declare global {
  interface Window {
    solana?: PhantomProvider
  }
}

const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
  "confirmed"
)

export interface CreatePoolParams {
  userPublicKey: string
  name: string
  symbol: string
  uri: string
  eventId: string
}

export interface TransactionResponse {
  success: boolean
  transaction?: string
  message?: string
  error?: string
  uri: string
  tokenData?: {
    id: number
    mintAddress: string
    poolAddress: string
    positionAddress: string
  }
}

export interface SignAndSubmitResult {
  success: boolean
  signature?: string
  error?: string
}

export interface SwapQuote {
  poolAddress: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  priceImpact: number
  fee: string
  swapDirection: string
}

export interface SwapParams {
  poolAddress: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  minAmountOut: string
  swapDirection: "tokenAToTokenB" | "tokenBToTokenA"
}

/**
 * Create a pool transaction on the server and return it for signing
 */
export async function createPoolTransaction(
  params: CreatePoolParams
): Promise<TransactionResponse> {
  try {
    const response = await fetch("/api/solana/create-transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
        uri: params.uri,
      }
    }

    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      uri: params.uri,
    }
  }
}

/**
 * Sign and submit a transaction using Phantom wallet
 */
export async function signAndSubmitTransaction(
  serializedTransaction: string,
  mintAddress?: string
): Promise<SignAndSubmitResult> {
  try {
    // Check if Phantom is available
    if (!window.solana || !window.solana.isPhantom) {
      return {
        success: false,
        error: "Phantom wallet not found. Please install Phantom.",
      }
    }

    if (!window.solana.isConnected || !window.solana.publicKey) {
      return {
        success: false,
        error: "Phantom wallet not connected",
      }
    }

    // Deserialize the transaction
    const transaction = Transaction.from(Buffer.from(serializedTransaction, "base64"))

    // Sign the transaction with Phantom
    const signedTransaction = await window.solana.signTransaction(transaction)

    // Submit the signed transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize())

    // Wait for confirmation
    await connection.confirmTransaction(signature, "confirmed")

    // Update database with transaction signature if mintAddress is provided
    if (mintAddress) {
      try {
        await fetch("/api/tokens", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mintAddress,
            transactionSignature: signature,
          }),
        })
      } catch (error) {
        console.error("Error updating database with transaction signature:", error)
        // Don't fail the entire operation if database update fails
      }
    }

    return {
      success: true,
      signature: signature,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(signature: string) {
  try {
    const response = await fetch(`/api/solana/create-transaction?signature=${signature}`)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      }
    }

    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Helper function to format SOL amounts
 */
export function formatSOL(lamports: number): string {
  return (lamports / 1000000000).toFixed(4)
}

/**
 * Helper function to validate Solana public key
 */
export function isValidPublicKey(publicKey: string): boolean {
  try {
    new PublicKey(publicKey)
    return true
  } catch {
    return false
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(publicKey: string): Promise<number> {
  try {
    const pubkey = new PublicKey(publicKey)
    const balance = await connection.getBalance(pubkey)
    return balance
  } catch (error) {
    console.error("Error getting wallet balance:", error)
    return 0
  }
}

/**
 * Check if Phantom wallet is installed
 * I think this can have compatiblity issues with multiple wallets
 */
export function isPhantomInstalled(): boolean {
  return typeof window !== "undefined" && window.solana?.isPhantom === true
}

/**
 * Connect to Phantom wallet
 */
export async function connectPhantom(): Promise<{ success: boolean; publicKey?: string; error?: string }> {
  try {
    if (!isPhantomInstalled()) {
      return {
        success: false,
        error: "Phantom wallet not found. Please install Phantom.",
      }
    }

    const response = await window.solana!.connect()

    return {
      success: true,
      publicKey: response.publicKey.toString(),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to connect to Phantom",
    }
  }
}

/**
 * Get connected Phantom wallet public key
 */
export function getPhantomPublicKey(): string | null {
  if (!isPhantomInstalled() || !window.solana?.isConnected) {
    return null
  }

  return window.solana.publicKey?.toString() || null
}

/**
 * Disconnect from Phantom wallet
 */
export async function disconnectPhantom(): Promise<void> {
  if (isPhantomInstalled() && window.solana?.isConnected) {
    await window.solana.disconnect()
  }
}

/**
 * Complete example: Create a pool transaction and have user sign it with Phantom
 */
export async function createPoolAndSign(
  name: string,
  symbol: string,
  uri: string,
  eventId: string
): Promise<SignAndSubmitResult> {
  // Get the connected Phantom wallet public key
  const userPublicKey = getPhantomPublicKey()

  if (!userPublicKey) {
    return {
      success: false,
      error: "Phantom wallet not connected",
    }
  }

  // Step 1: Create the pool transaction
  const createResult = await createPoolTransaction({
    userPublicKey,
    name,
    symbol,
    uri,
    eventId,
  })

  if (!createResult.success || !createResult.transaction) {
    return {
      success: false,
      error: createResult.error || "Failed to create pool transaction",
    }
  }

  // Step 2: Sign and submit the transaction with Phantom
  const submitResult = await signAndSubmitTransaction(createResult.transaction)

  return submitResult
}

/**
 * Sign and simulate a transaction using Phantom wallet
 */
export async function simulateTransaction(
  serializedTransaction: string
): Promise<{ success: boolean; logs?: string[] | null; error?: any }> {
  try {
    // Check if Phantom is available
    if (!window.solana || !window.solana.isPhantom) {
      return {
        success: false,
        error: "Phantom wallet not found. Please install Phantom.",
      }
    }

    if (!window.solana.isConnected || !window.solana.publicKey) {
      return {
        success: false,
        error: "Phantom wallet not connected",
      }
    }

    // Deserialize the transaction
    const transaction = Transaction.from(
      Buffer.from(serializedTransaction, "base64")
    )

    // Sign the transaction with Phantom to prepare for simulation
    const signedTransaction = await window.solana.signTransaction(transaction)

    // Simulate the transaction
    const { value: simulationResult } =
      await connection.simulateTransaction(signedTransaction)

    if (simulationResult.err) {
      return {
        success: false,
        error: simulationResult.err,
        logs: simulationResult.logs,
      }
    }

    return { success: true, logs: simulationResult.logs }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get swap quote from Meteora DAMM v2 pool
 */
export async function getSwapQuote(params: {
  poolAddress: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  swapDirection?: "tokenAToTokenB" | "tokenBToTokenA"
}): Promise<{ success: boolean; quote?: SwapQuote; error?: string }> {
  try {
    const queryParams = new URLSearchParams({
      poolAddress: params.poolAddress,
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      swapDirection: params.swapDirection || "tokenAToTokenB"
    })

    const response = await fetch(`/api/solana/swap/quote?${queryParams}`)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`
      }
    }

    return {
      success: true,
      quote: data.quote
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Execute swap transaction
 */
export async function executeSwap(params: SwapParams): Promise<{
  success: boolean
  transaction?: string
  swapDetails?: any
  error?: string
}> {
  try {
    const userPublicKey = getPhantomPublicKey()
    if (!userPublicKey) {
      return {
        success: false,
        error: "Phantom wallet not connected"
      }
    }

    const response = await fetch("/api/solana/swap/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        userAddress: userPublicKey
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`
      }
    }

    return {
      success: true,
      transaction: data.transaction,
      swapDetails: data.swapDetails
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Complete swap: get quote, create transaction, and have user sign it
 */
export async function performSwap(params: SwapParams): Promise<SignAndSubmitResult> {
  try {
    // Step 1: Execute swap (create transaction)
    const swapResult = await executeSwap(params)

    if (!swapResult.success || !swapResult.transaction) {
      return {
        success: false,
        error: swapResult.error || "Failed to create swap transaction"
      }
    }

    // Step 2: Sign and submit the transaction
    const submitResult = await signAndSubmitTransaction(swapResult.transaction)

    return submitResult
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}

/**
 * Helper function to calculate minimum amount out with slippage
 */
export function calculateMinAmountOut(amountOut: string, slippagePercent: number): string {
  const amount = BigInt(amountOut)
  const slippageBps = BigInt(Math.floor(slippagePercent * 100)) // Convert to basis points
  const minAmount = amount - (amount * slippageBps) / BigInt(10000)
  return minAmount.toString()
}

/**
 * Helper function to format swap direction based on token addresses
 */
export function determineSwapDirection(
  tokenIn: string,
  tokenOut: string,
  poolTokenA: string,
  poolTokenB: string
): "tokenAToTokenB" | "tokenBToTokenA" {
  if (tokenIn === poolTokenA && tokenOut === poolTokenB) {
    return "tokenAToTokenB"
  } else if (tokenIn === poolTokenB && tokenOut === poolTokenA) {
    return "tokenBToTokenA"
  } else {
    throw new Error("Invalid token pair for this pool")
  }
}

/**
 * Get user's token portfolio (all tokens with their balances)
 */
export async function getUserTokens(userAddress: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const response = await fetch(`/api/user/tokens?userAddress=${encodeURIComponent(userAddress)}`)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }
  }
}