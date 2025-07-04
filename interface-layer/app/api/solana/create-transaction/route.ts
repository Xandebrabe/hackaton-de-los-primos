import { NextRequest, NextResponse } from "next/server"
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
} from "@solana/web3.js"
import {
    DynamicBondingCurveClient,
} from "@meteora-ag/dynamic-bonding-curve-sdk"
import {
    BaseFee,
    CpAmm,
    getDynamicFeeParams,
    getBaseFeeParams,
    getPriceFromSqrtPrice,
    getSqrtPriceFromPrice,
    MAX_SQRT_PRICE,
    MIN_SQRT_PRICE,
    PoolFeesParams,
    BIN_STEP_BPS_DEFAULT,
    BIN_STEP_BPS_U128_DEFAULT,
    getLiquidityDeltaFromAmountA,
    calculateTransferFeeIncludedAmount
} from "@meteora-ag/cp-amm-sdk"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { BN } from "@coral-xyz/anchor"

// Solana RPC connection
const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
)

// DBC Config Address for DAMM V2
const DBC_CONFIG_ADDRESS_DAMM_V2_2 = new PublicKey(
    "have_to_find_good_one"
)

const USDC = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
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

async function createDammV2PoolTransaction(creator: PublicKey, baseTokenMint: PublicKey) {
    const cpAmmInstance = new CpAmm(connection)

    const positionNft = Keypair.generate()

    const initialPrice: number = 0.1;
    const initPriceSqrt = getSqrtPriceFromPrice(initialPrice.toString(), 6, 6);

    const poolFeesParams: PoolFeesParams = {
		baseFee,
		protocolFeePercent: 20,
		partnerFeePercent: 0,
		referralFeePercent: 20,
		dynamicFee
	}

    const {
        tx: initCustomizePoolTx,
        pool,
        position
    } = await cpAmmInstance.createCustomPool({
        payer: creator,
        creator: creator,
        positionNft: positionNft.publicKey,
        tokenAMint: baseTokenMint,
        tokenBMint: USDC,
        tokenAAmount: new BN(1_000_000e6),
        tokenBAmount: new BN(0),
        sqrtMinPrice: initPriceSqrt,
        sqrtMaxPrice: MAX_SQRT_PRICE,
        liquidityDelta: liquidityDelta,
        initSqrtPrice: initPriceSqrt,
        poolFees: poolFeesParams,
        hasAlphaVault: hasAlphaVault,
        activationType: null,
        collectFeeMode: 1,
        activationPoint: null,
        tokenAProgram: TOKEN_PROGRAM_ID,
        tokenBProgram: TOKEN_PROGRAM_ID
    })
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