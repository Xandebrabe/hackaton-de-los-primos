import { NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"
import { getAllTokenCreations, TokenCreationRecord } from "@/lib/database"

const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    "confirmed"
)

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userAddress = searchParams.get("userAddress")

        if (!userAddress) {
            return NextResponse.json(
                { error: "User address is required" },
                { status: 400 }
            )
        }

        // Validate the user address
        let userPublicKey: PublicKey
        try {
            userPublicKey = new PublicKey(userAddress)
        } catch (error) {
            return NextResponse.json(
                { error: "Invalid user address format" },
                { status: 400 }
            )
        }

        // Get all tokens from database to check user's balance in each
        const allTokens = await getAllTokenCreations()

        if (!allTokens || allTokens.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No tokens found in the system",
                tokens: []
            })
        }

        // Check ATA balances for each token
        const tokenBalances = await Promise.all(
            allTokens.map(async (token: TokenCreationRecord) => {
                try {
                    const mintPublicKey = new PublicKey(token.mint_address)
                    const ataAddress = await getAssociatedTokenAddress(
                        mintPublicKey,
                        userPublicKey
                    )

                    // Get the ATA account info
                    const ataAccount = await getAccount(connection, ataAddress)

                    return {
                        tokenId: token.id,
                        name: token.name,
                        symbol: token.symbol,
                        mintAddress: token.mint_address,
                        poolAddress: token.pool_address,
                        positionAddress: token.position_address,
                        ataAddress: ataAddress.toString(),
                        balance: ataAccount.amount.toString(),
                        balanceFormatted: (Number(ataAccount.amount) / 1e6).toFixed(6), // Assuming 6 decimals
                        createdAt: token.created_at,
                        transactionSignature: token.transaction_signature,
                        hasBalance: ataAccount.amount > BigInt(0)
                    }
                } catch (error) {
                    console.error(`Error checking balance for token ${token.mint_address}:`, error)

                    // If ATA doesn't exist or other error, return with 0 balance
                    return {
                        tokenId: token.id,
                        name: token.name,
                        symbol: token.symbol,
                        mintAddress: token.mint_address,
                        poolAddress: token.pool_address,
                        positionAddress: token.position_address,
                        ataAddress: null,
                        balance: "0",
                        balanceFormatted: "0.000000",
                        createdAt: token.created_at,
                        transactionSignature: token.transaction_signature,
                        hasBalance: false,
                        error: error instanceof Error ? error.message : "Failed to get balance"
                    }
                }
            })
        )

        // Calculate summary stats
        const totalTokens = tokenBalances.length
        const tokensWithBalance = tokenBalances.filter((t: any) => t.hasBalance).length
        const totalBalanceValue = tokenBalances.reduce((sum: number, token: any) => {
            return sum + parseFloat(token.balanceFormatted)
        }, 0)

        return NextResponse.json({
            success: true,
            userAddress,
            summary: {
                totalTokens,
                tokensWithBalance,
                tokensWithoutBalance: totalTokens - tokensWithBalance,
                totalBalanceValue: totalBalanceValue.toFixed(6)
            },
            tokens: tokenBalances
        })

    } catch (error) {
        console.error("User tokens verification error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to verify user tokens" },
            { status: 500 }
        )
    }
}