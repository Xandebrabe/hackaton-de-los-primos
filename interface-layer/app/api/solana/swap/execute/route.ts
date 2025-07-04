import { NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { CpAmm } from "@meteora-ag/cp-amm-sdk"
import { BN } from "@coral-xyz/anchor"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"

const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    "confirmed"
)

interface SwapRequest {
    poolAddress: string
    tokenIn: string
    tokenOut: string
    amountIn: string
    minAmountOut: string
    userAddress: string
}

export async function POST(request: NextRequest) {
    try {
        const body: SwapRequest = await request.json()

        // Validate required fields
        if (!body.poolAddress || !body.tokenIn || !body.tokenOut || !body.amountIn || !body.minAmountOut || !body.userAddress) {
            return NextResponse.json(
                { error: "All fields are required: poolAddress, tokenIn, tokenOut, amountIn, minAmountOut, userAddress" },
                { status: 400 }
            )
        }

        const cpAmm = new CpAmm(connection)
        const userPublicKey = new PublicKey(body.userAddress)

        const poolState = await cpAmm.fetchPoolState(new PublicKey(body.poolAddress))

        // Create swap transaction
        const swapTx = await cpAmm.swap({
            payer: userPublicKey,
            pool: new PublicKey(body.poolAddress),
            inputTokenMint: new PublicKey(body.tokenIn),
            outputTokenMint: new PublicKey(body.tokenOut),
            amountIn: new BN(body.amountIn),
            minimumAmountOut: new BN(body.minAmountOut),
            tokenAVault: poolState.tokenAVault,
            tokenBVault: poolState.tokenBVault,
            tokenAMint: new PublicKey(poolState.tokenAMint),
            tokenBMint: new PublicKey(poolState.tokenBMint),
            tokenAProgram: TOKEN_PROGRAM_ID,
            tokenBProgram: TOKEN_PROGRAM_ID,
            referralTokenAccount: null,
        })

        // Get latest blockhash and set fee payer
        const { blockhash } = await connection.getLatestBlockhash()
        swapTx.recentBlockhash = blockhash
        swapTx.feePayer = userPublicKey

        // Serialize the transaction for client-side signing
        const serializedTransaction = swapTx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        })

        return NextResponse.json({
            success: true,
            transaction: Buffer.from(serializedTransaction).toString("base64"),
            message: "Swap transaction ready. Please sign with your wallet.",
            swapDetails: {
                poolAddress: body.poolAddress,
                tokenIn: body.tokenIn,
                tokenOut: body.tokenOut,
                amountIn: body.amountIn,
                minAmountOut: body.minAmountOut,
            }
        })

    } catch (error) {
        console.error("Swap execution error:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create swap transaction" },
            { status: 500 }
        )
    }
}