import { NextRequest, NextResponse } from "next/server"
import {
    Connection,
    PublicKey,
    Transaction,
} from "@solana/web3.js"
import {
    DynamicBondingCurveClient,
} from "@meteora-ag/dynamic-bonding-curve-sdk"

// Solana RPC connection
const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
)

// DBC Config Address for DAMM V2
const DBC_CONFIG_ADDRESS_DAMM_V2_2 = new PublicKey(
    "have_to_find_good_one"
)

interface CreatePoolRequest {
    userPublicKey: string
    baseMint: string
    name: string
    symbol: string
    uri: string
}

// This returns a serialized tx that we need to add Solana wallet adapter to sign and broadcast
export async function POST(request: NextRequest) {
    try {
        const body: CreatePoolRequest = await request.json()

        // Validate required fields
        if (!body.userPublicKey || !body.baseMint || !body.name || !body.symbol || !body.uri) {
            return NextResponse.json(
                { error: "All fields are required: userPublicKey, baseMint, name, symbol, uri" },
                { status: 400 }
            )
        }

        const userPublicKey = new PublicKey(body.userPublicKey)
        const baseMint = new PublicKey(body.baseMint)

        // Create the pool transaction
        const transaction = await createPoolTransaction(body, userPublicKey, baseMint)

        // Get latest blockhash and set fee payer
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = userPublicKey

        // Serialize the transaction for client-side signing
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        })

        return NextResponse.json({
            success: true,
            transaction: Buffer.from(serializedTransaction).toString("base64"),
            message: "Pool creation transaction ready. Please sign with your wallet.",
        })

    } catch (error) {
        console.error("Create pool transaction error:", error)

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

async function createPoolTransaction(
    body: CreatePoolRequest,
    userPublicKey: PublicKey,
    baseMint: PublicKey
): Promise<Transaction> {
    const client = new DynamicBondingCurveClient(connection, "confirmed")

    // Create the pool transaction
    const transaction = await client.pool.createPool({
        baseMint: baseMint,
        config: DBC_CONFIG_ADDRESS_DAMM_V2_2,
        name: body.name,
        uri: body.uri,
        symbol: body.symbol,
        payer: userPublicKey,
        poolCreator: userPublicKey,
    })

    return transaction
}

// Helper function to get transaction status
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const signature = searchParams.get("signature")

    if (!signature) {
        return NextResponse.json(
            { error: "Transaction signature is required" },
            { status: 400 }
        )
    }

    try {
        const status = await connection.getSignatureStatus(signature)

        return NextResponse.json({
            success: true,
            status: status.value,
            signature: signature,
        })
    } catch (error) {
        console.error("Get transaction status error:", error)
        return NextResponse.json(
            { error: "Failed to get transaction status" },
            { status: 500 }
        )
    }
}