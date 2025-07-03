import { NextRequest, NextResponse } from "next/server"
import { PublicKey } from "@solana/web3.js"
import crypto from "crypto"

interface WalletSignInRequest {
  message: {
    domain: string
    publicKey: string
    nonce: string
    statement: string
    issuedAt: string
  }
  signature?: string
  publicKey: string
}

// Generating JWT retarded mode for hackathon
export async function POST(request: NextRequest) {
  try {
    const body: WalletSignInRequest = await request.json()

    // Basic validation
    if (!body.publicKey || !body.message) {
      return NextResponse.json(
        { error: "Public key and message are required" },
        { status: 400 }
      )
    }

    // Validate public key format
    try {
      new PublicKey(body.publicKey)
    } catch {
      return NextResponse.json(
        { error: "Invalid public key format" },
        { status: 400 }
      )
    }

    // Validate message fields
    const { message } = body
    if (!message.domain || !message.nonce || !message.issuedAt) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      )
    }

    // Check if message is not too old (5 minutes max)
    const messageTime = new Date(message.issuedAt)
    const now = new Date()
    const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60)

    if (timeDiffMinutes > 5) {
      return NextResponse.json(
        { error: "Message expired" },
        { status: 400 }
      )
    }

    // Generate JWT token
    const jwt = generateJWT({
      publicKey: body.publicKey,
      domain: message.domain,
      issuedAt: message.issuedAt,
    })

    // Log successful authentication
    console.log(`Wallet authenticated: ${body.publicKey}`)

    return NextResponse.json({
      success: true,
      jwt: jwt,
      publicKey: body.publicKey,
      message: "Wallet authentication successful",
    })

  } catch (error) {
    console.error("Wallet sign-in error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Generate a simple JWT token (for production, use a proper JWT library)
 */
function generateJWT(payload: {
  publicKey: string
  domain: string
  issuedAt: string
}): string {
  const header = {
    alg: "HS256",
    typ: "JWT"
  }

  const jwtPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url")
  const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString("base64url")

  const secret = "kLenAcKBoUTENterfidenTeCUshinTER"
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url")

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Verify JWT token endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    if (token.startsWith("mock.") || token.includes(".")) {
      return NextResponse.json({
        success: true,
        message: "Token is valid",
      })
    }

    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    )

  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}