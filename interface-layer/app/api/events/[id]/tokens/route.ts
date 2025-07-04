import { NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"
import { getTokenCreationsByEvent, TokenCreationRecord } from "@/lib/database"

const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    "confirmed"
)

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = params.id

        if (!eventId) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            )
        }

        // Get tokens for this specific event
        const eventTokens = await getTokenCreationsByEvent(eventId)

        if (!eventTokens || eventTokens.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No tokens found for this event",
                eventId,
                tokens: []
            })
        }

        // Verify tokens exist on-chain and get basic info
        const validTokens = await Promise.all(
            eventTokens.map(async (token: TokenCreationRecord) => {
                try {
                    const mintPublicKey = new PublicKey(token.mint_address)

                    // Check if the mint actually exists on-chain
                    const mintAccountInfo = await connection.getAccountInfo(mintPublicKey)
                    if (!mintAccountInfo) {
                        console.log(`Mint ${token.mint_address} does not exist on-chain, skipping`)
                        return null
                    }

                    return {
                        tokenId: token.id,
                        name: token.name,
                        symbol: token.symbol,
                        mintAddress: token.mint_address,
                        poolAddress: token.pool_address,
                        positionAddress: token.position_address,
                        createdAt: token.created_at,
                        transactionSignature: token.transaction_signature,
                        eventId: token.event_id
                    }
                } catch (error) {
                    console.error(`Error checking token ${token.mint_address}:`, error)
                    return null
                }
            })
        )

        // Filter out null values (tokens that don't exist on-chain)
        const confirmedTokens = validTokens.filter((token): token is NonNullable<typeof token> => token !== null)

        return NextResponse.json({
            success: true,
            eventId,
            tokenCount: confirmedTokens.length,
            tokens: confirmedTokens
        })

    } catch (error) {
        console.error("Get event tokens error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to get event tokens" },
            { status: 500 }
        )
    }
}