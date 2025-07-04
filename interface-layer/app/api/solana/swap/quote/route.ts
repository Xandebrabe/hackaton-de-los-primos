import { NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { CpAmm } from "@meteora-ag/cp-amm-sdk"
import { BN } from "@coral-xyz/anchor"

const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    "confirmed"
)

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const poolAddress = searchParams.get("poolAddress")
        const tokenIn = searchParams.get("tokenIn")
        const tokenOut = searchParams.get("tokenOut")
        const amountIn = searchParams.get("amountIn")
        const swapDirection = searchParams.get("swapDirection") || "tokenAToTokenB"

        // Validate required parameters
        if (!poolAddress || !tokenIn || !tokenOut || !amountIn) {
            return NextResponse.json(
                { error: "poolAddress, tokenIn, tokenOut, and amountIn are required" },
                { status: 400 }
            )
        }

        const cpAmm = new CpAmm(connection)

        const poolState = await cpAmm.fetchPoolState(new PublicKey(poolAddress))

        // Get swap quote
        const quoteResult = await cpAmm.getQuote({
            poolState: poolState,
            inputTokenMint: new PublicKey(tokenIn),
            slippage: 0.2,
            inAmount: new BN(amountIn),
            // Use current time and slot
            currentTime: Date.now() / 1000,
            currentSlot: await connection.getSlot()
        })

        return NextResponse.json({
            success: true,
            quote: {
                poolAddress,
                tokenIn,
                tokenOut,
                amountIn,
                amountOut: quoteResult.swapOutAmount.toString(),
                priceImpact: quoteResult.priceImpact,
                fee: quoteResult.totalFee.toString(),
            }
        })

    } catch (error) {
        console.error("Swap quote error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to get swap quote" },
            { status: 500 }
        )
    }
}