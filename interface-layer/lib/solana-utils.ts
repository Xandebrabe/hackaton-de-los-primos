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
  "https://api.mainnet-beta.solana.com",
  "confirmed"
)

export interface CreatePoolParams {
  userPublicKey: string
  name: string
  symbol: string
  uri: string
}

export interface TransactionResponse {
  success: boolean
  transaction?: string
  message?: string
  error?: string
  uri: string
}

export interface SignAndSubmitResult {
  success: boolean
  signature?: string
  error?: string
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
  serializedTransaction: string
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
  uri: string
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