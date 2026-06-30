import * as fs from "fs/promises"
import * as path from "path"
import crypto from "crypto"

const TEMP_DIR = process.env.UPLOAD_TEMP_DIR || "/tmp/uploads"

export async function ensureTempDir(): Promise<string> {
  await fs.mkdir(TEMP_DIR, { recursive: true })
  return TEMP_DIR
}

export function generateTempPath(prefix: string, extension: string): string {
  const randomName = crypto.randomBytes(16).toString("hex")
  return path.join(TEMP_DIR, `${prefix}-${randomName}.${extension}`)
}

export async function saveTempFile(buffer: Buffer, prefix: string, extension: string): Promise<string> {
  await ensureTempDir()
  const tempPath = generateTempPath(prefix, extension)
  await fs.writeFile(tempPath, buffer)
  return tempPath
}

export async function cleanup(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath)
    } catch {
      // swallow — file may already be gone
    }
  }
}
