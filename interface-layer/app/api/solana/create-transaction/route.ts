import { NextRequest, NextResponse } from "next/server"
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js"
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
import {
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    MINT_SIZE,
    getMinimumBalanceForRentExemptMint,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction
} from "@solana/spl-token"
import { BN } from "@coral-xyz/anchor"

// Solana RPC connection
const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
)

const USDC = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
)

const TOKEN_A_SUPPLY = new BN(1_000_000e6)

interface CreatePoolRequest {
    userPublicKey: string
    baseMint: string
    name: string
    symbol: string
    uri: string
}

interface CreateDammV2PoolResponse {
    tx: Transaction,
    pool: PublicKey,
    position: PublicKey,
    signers: Keypair[]
}

// This returns a serialized tx that we need to add Solana wallet adapter to sign and broadcast
export async function POST(request: NextRequest) {
    try {
        const body: CreatePoolRequest = await request.json()

        // Validate required fields
        if (!body.userPublicKey || !body.name || !body.symbol || !body.uri) {
            return NextResponse.json(
                { error: "All fields are required: userPublicKey, name, symbol, uri" },
                { status: 400 }
            )
        }

        const userPublicKey = new PublicKey(body.userPublicKey)

        // Create the pool transaction
        const { tx, pool, position, signers } = await createDammV2PoolTransaction(userPublicKey, TOKEN_A_SUPPLY)

        // Get latest blockhash and set fee payer
        const { blockhash } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = userPublicKey

        // Partially sign with server-side keypairs
        tx.partialSign(...signers)

        // Serialize the transaction for client-side signing
        const serializedTransaction = tx.serialize({
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

async function createDammV2PoolTransaction(creator: PublicKey, tokenAAmount: BN): Promise<CreateDammV2PoolResponse> {
    const cpAmmInstance = new CpAmm(connection)

    const mintKeypair = Keypair.generate()
    const baseTokenMint = mintKeypair.publicKey

    const associatedTokenAccount = await getAssociatedTokenAddress(
        baseTokenMint,
        creator
    );

    const rentLamports = await getMinimumBalanceForRentExemptMint(connection)

    const createMintAccountIx = SystemProgram.createAccount({
        fromPubkey: creator,
        newAccountPubkey: baseTokenMint,
        space: MINT_SIZE,
        lamports: rentLamports,
        programId: TOKEN_PROGRAM_ID,
    });

    const initializeMintIx = createInitializeMintInstruction(
        baseTokenMint,
        6, // decimals
        creator,
        creator // freeze authority
    );

    const createAtaIx = createAssociatedTokenAccountInstruction(
        creator,
        associatedTokenAccount,
        creator,
        baseTokenMint
    );

    const mintToAtaIx = createMintToInstruction(
        baseTokenMint,
        associatedTokenAccount,
        creator,
        BigInt(tokenAAmount.toString())
    );

    const positionNft = Keypair.generate()

    const initialPrice: number = 0.1;
    const initPriceSqrt = getSqrtPriceFromPrice(initialPrice.toString(), 6, 6);

    const baseFee: BaseFee = getBaseFeeParams(
        100,
        100,
        0,
        0,
        0
    )

    const poolFeesParams: PoolFeesParams = {
        baseFee,
        protocolFeePercent: 20,
        partnerFeePercent: 0,
        referralFeePercent: 20,
        dynamicFee: null,
    }

    let liquidityDelta = getLiquidityDeltaFromAmountA(
        tokenAAmount,
        initPriceSqrt,
        MAX_SQRT_PRICE
    )

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
        tokenAAmount: tokenAAmount,
        tokenBAmount: new BN(0),
        sqrtMinPrice: initPriceSqrt,
        sqrtMaxPrice: MAX_SQRT_PRICE,
        liquidityDelta: liquidityDelta,
        initSqrtPrice: initPriceSqrt,
        poolFees: poolFeesParams,
        hasAlphaVault: false,
        activationType: 0,
        collectFeeMode: 1,
        activationPoint: null,
        tokenAProgram: TOKEN_PROGRAM_ID,
        tokenBProgram: TOKEN_PROGRAM_ID
    })

    const transaction = new Transaction()
        .add(createMintAccountIx)
        .add(initializeMintIx)
        .add(createAtaIx)
        .add(mintToAtaIx)
        .add(...initCustomizePoolTx.instructions);

    return {
        tx: transaction,
        pool,
        position,
        signers: [mintKeypair, positionNft]
    }
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