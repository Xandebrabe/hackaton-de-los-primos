import { NextRequest, NextResponse } from 'next/server';
import { generateEntitySecret, initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { registerEntitySecretCiphertext } from '@circle-fin/developer-controlled-wallets';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { walletSetName = "Event Wallet Set", blockchains = ["MATIC-AMOY"] } = body;

        const API_KEY = process.env.CIRCLE_API_KEY;
        if (!API_KEY) {
            throw new Error("CIRCLE_API_KEY is missing");
        }

        const client = initiateDeveloperControlledWalletsClient({
            apiKey: API_KEY,
            entitySecret: process.env.ENTITY_SECRET,
        })

        const walletSetResponse = await client.createWalletSet({
            name: walletSetName,
        })

        console.log('Created WalletSet', walletSetResponse.data?.walletSet)

        if (!walletSetResponse.data?.walletSet?.id) {
            throw new Error("WalletSet creation failed: missing ID");
        }

        const walletsResponse = await client.createWallets({
            blockchains,
            count: 1,
            walletSetId: walletSetResponse.data.walletSet.id,
        })

        console.log('Created Wallets', walletsResponse.data?.wallets)

        return NextResponse.json({
            success: true,
            walletSet: walletSetResponse.data.walletSet,
            wallets: walletsResponse.data?.wallets,
        });
    } catch (err) {
        console.error("Circle wallet creation failed:", err);
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
        }, { status: 500 });
    }
}
