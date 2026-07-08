import mongoose from "mongoose"

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
}

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached
}

function buildUri(): string {
  const base = process.env.MONGODB_URI
  if (!base) throw new Error("MONGODB_URI is not configured.")
  const separator = base.includes("?") ? "&" : "?"
  const params = [`serverSelectionTimeoutMS=15000`]
  if (process.env.NODE_ENV !== "production") {
    params.push("tlsInsecure=true")
  }
  return `${base}${separator}${params.join("&")}`
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn

  const uri = buildUri()

  cached.promise ??= mongoose.connect(uri, {
    bufferCommands: false,
  })

  try {
    cached.conn = await cached.promise
    console.log("[MongoDB] Connected successfully")
  } catch (error) {
    cached.promise = null
    console.error("[MongoDB] Connection failed:", error)
    throw error
  }

  return cached.conn
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect()
    cached.conn = null
    cached.promise = null
    console.log("[MongoDB] Disconnected")
  }
}
