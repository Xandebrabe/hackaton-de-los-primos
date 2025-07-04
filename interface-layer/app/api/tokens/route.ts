import { NextRequest, NextResponse } from "next/server"
import { getTokenCreationsByCreator, getTokenCreationByMint } from "@/lib/database"
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const creatorAddress = searchParams.get("creator")
        const mintAddress = searchParams.get("mint")

        if (creatorAddress) {
            // Get all tokens created by a specific creator
            const tokens = await getTokenCreationsByCreator(creatorAddress)
            return NextResponse.json({
                success: true,
                tokens,
                count: tokens.length
            })
        } else if (mintAddress) {
            // Get specific token by mint address
            const token = await getTokenCreationByMint(mintAddress)
            if (token) {
                return NextResponse.json({
                    success: true,
                    token
                })
            } else {
                return NextResponse.json(
                    { error: "Token not found" },
                    { status: 404 }
                )
            }
        } else {
            return NextResponse.json(
                { error: "Please provide either 'creator' or 'mint' query parameter" },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error("Get tokens error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { mintAddress, transactionSignature } = body

        if (!mintAddress || !transactionSignature) {
            return NextResponse.json(
                { error: "Both mintAddress and transactionSignature are required" },
                { status: 400 }
            )
        }

        const client = await pool.connect()

        try {
            const result = await client.query(`
                UPDATE token_creations
                SET transaction_signature = $1
                WHERE mint_address = $2
                RETURNING *
            `, [transactionSignature, mintAddress])

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: "Token not found" },
                    { status: 404 }
                )
            }

            return NextResponse.json({
                success: true,
                token: result.rows[0]
            })
        } finally {
            client.release()
        }
    } catch (error) {
        console.error("Update token error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}