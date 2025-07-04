import { Pool } from 'pg'

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export interface TokenCreationRecord {
  id?: number
  mint_address: string
  creator_address: string
  pool_address: string
  position_address: string
  name: string
  symbol: string
  uri: string
  event_id: string
  transaction_signature?: string
  created_at?: Date
}

// Initialize database schema
export async function initializeDatabase() {
  const client = await pool.connect()

  try {
    // Create the tokens table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS token_creations (
        id SERIAL PRIMARY KEY,
        mint_address VARCHAR(44) NOT NULL UNIQUE,
        creator_address VARCHAR(44) NOT NULL,
        pool_address VARCHAR(44) NOT NULL,
        position_address VARCHAR(44) NOT NULL,
        name VARCHAR(255) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        uri TEXT,
        event_id VARCHAR(255) NOT NULL,
        transaction_signature VARCHAR(88),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_token_creations_creator
      ON token_creations (creator_address)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_token_creations_mint
      ON token_creations (mint_address)
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_token_creations_event
      ON token_creations (event_id)
    `)

    console.log('Database schema initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  } finally {
    client.release()
  }
}

// Save token creation record to database
export async function saveTokenCreation(record: TokenCreationRecord): Promise<number> {
  const client = await pool.connect()

  try {
    const result = await client.query(`
      INSERT INTO token_creations (
        mint_address,
        creator_address,
        pool_address,
        position_address,
        name,
        symbol,
        uri,
        event_id,
        transaction_signature
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      record.mint_address,
      record.creator_address,
      record.pool_address,
      record.position_address,
      record.name,
      record.symbol,
      record.uri,
      record.event_id,
      record.transaction_signature
    ])

    return result.rows[0].id
  } catch (error) {
    console.error('Error saving token creation:', error)
    throw error
  } finally {
    client.release()
  }
}

// Get token creations by creator address
export async function getTokenCreationsByCreator(creatorAddress: string): Promise<TokenCreationRecord[]> {
  const client = await pool.connect()

  try {
    const result = await client.query(`
      SELECT * FROM token_creations
      WHERE creator_address = $1
      ORDER BY created_at DESC
    `, [creatorAddress])

    return result.rows
  } catch (error) {
    console.error('Error fetching token creations:', error)
    throw error
  } finally {
    client.release()
  }
}

// Get token creations by event ID
export async function getTokenCreationsByEvent(eventId: string): Promise<TokenCreationRecord[]> {
  const client = await pool.connect()

  try {
    const result = await client.query(`
      SELECT * FROM token_creations
      WHERE event_id = $1
      ORDER BY created_at DESC
    `, [eventId])

    return result.rows
  } catch (error) {
    console.error('Error fetching token creations by event:', error)
    throw error
  } finally {
    client.release()
  }
}

// Get all token creations (for checking user balances across all tokens)
export async function getAllTokenCreations(): Promise<TokenCreationRecord[]> {
  const client = await pool.connect()

  try {
    const result = await client.query(`
      SELECT * FROM token_creations
      ORDER BY created_at DESC
    `)

    return result.rows
  } catch (error) {
    console.error('Error fetching all token creations:', error)
    throw error
  } finally {
    client.release()
  }
}

// Get token creation by mint address
export async function getTokenCreationByMint(mintAddress: string): Promise<TokenCreationRecord | null> {
  const client = await pool.connect()

  try {
    const result = await client.query(`
      SELECT * FROM token_creations
      WHERE mint_address = $1
    `, [mintAddress])

    return result.rows[0] || null
  } catch (error) {
    console.error('Error fetching token creation:', error)
    throw error
  } finally {
    client.release()
  }
}

// Close database connection pool
export async function closeDatabase() {
  await pool.end()
}