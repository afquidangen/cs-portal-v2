import { execFile } from "child_process"
import { promisify } from "util"
import * as fs from "fs/promises"
import { logger } from "./logger.service"
import { saveTempFile, cleanup } from "./temp-file.service"

const log = logger("PDF")

const execFileAsync = promisify(execFile)

const GS_COMMANDS = ["gswin64c", "gswin32c", "gs"]

const GS_FALLBACK_PATHS = [
  "C:\\Program Files\\gs\\gs10.07.1\\bin\\gswin64c.exe",
  "C:\\Program Files\\gs\\gs10.07.0\\bin\\gswin64c.exe",
  "C:\\Program Files (x86)\\gs\\gs10.07.1\\bin\\gswin64c.exe",
  "C:\\Program Files (x86)\\gs\\gs10.07.0\\bin\\gswin64c.exe",
]

let _gsPath: string | null | undefined = undefined

async function findGhostscript(): Promise<string | null> {
  if (_gsPath !== undefined) return _gsPath

  for (const cmd of GS_COMMANDS) {
    try {
      const { stdout } = await execFileAsync(cmd, ["--version"], { timeout: 5000 })
      if (stdout.trim()) {
        _gsPath = cmd
        log.info(`Ghostscript found: ${cmd} v${stdout.trim()}`)
        return cmd
      }
    } catch {
      continue
    }
  }

  for (const fallbackPath of GS_FALLBACK_PATHS) {
    try {
      const { stdout } = await execFileAsync(fallbackPath, ["--version"], { timeout: 5000 })
      if (stdout.trim()) {
        _gsPath = fallbackPath
        log.info(`Ghostscript found: ${fallbackPath} v${stdout.trim()}`)
        return fallbackPath
      }
    } catch {
      continue
    }
  }

  _gsPath = null
  log.warn("Ghostscript not found on this system")
  return null
}

export function needsCompression(fileSize: number): boolean {
  const limit = parseInt(process.env.CLOUDINARY_UPLOAD_LIMIT || "10485760", 10)
  return fileSize > limit
}

export async function getFileSize(filePath: string): Promise<number> {
  const stat = await fs.stat(filePath)
  return stat.size
}

export async function compressPdf(inputPath: string, outputPath: string): Promise<void> {
  const gsPath = await findGhostscript()
  if (!gsPath) {
    throw new Error("Ghostscript is not available on this system.")
  }

  const profile = process.env.PDF_COMPRESSION_PROFILE || "ebook"

  const args = [
    "-sDEVICE=pdfwrite",
    `-dPDFSETTINGS=/${profile}`,
    "-dCompatibilityLevel=1.4",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    "-dSAFER",
    "-dDetectDuplicateImages=true",
    "-dDownsampleColorImages=true",
    "-dDownsampleGrayImages=true",
    "-dDownsampleMonoImages=true",
    "-dColorImageResolution=150",
    "-dGrayImageResolution=150",
    "-dMonoImageResolution=150",
    "-dCompressFonts=true",
    "-dSubsetFonts=true",
    "-dEmbedAllFonts=true",
    "-dPreserveEPSInfo=false",
    "-dPreserveOPIComments=false",
    "-dPreserveOverprintSettings=false",
    `-sOutputFile=${outputPath}`,
    inputPath,
  ]

  const start = Date.now()
  await execFileAsync(gsPath, args, { timeout: 120000 })
  const duration = Date.now() - start

  const inputSize = await getFileSize(inputPath)
  const outputSize = await getFileSize(outputPath)
  const ratio = inputSize > 0 ? ((1 - outputSize / inputSize) * 100).toFixed(1) : "0.0"

  log.info(`Compressed ${(inputSize / 1024 / 1024).toFixed(1)}MB → ${(outputSize / 1024 / 1024).toFixed(1)}MB (${ratio}% reduction) in ${duration}ms`)
}

export async function compressBuffer(buffer: Buffer): Promise<{
  compressedBuffer: Buffer
  originalSize: number
  compressedSize: number
}> {
  const tempFiles: string[] = []

  try {
    const inputPath = await saveTempFile(buffer, "original", "pdf")
    tempFiles.push(inputPath)

    const outputPath = inputPath.replace("original-", "compressed-")
    tempFiles.push(outputPath)

    await compressPdf(inputPath, outputPath)

    const compressedBuffer = await fs.readFile(outputPath)
    const originalSize = buffer.length
    const compressedSize = compressedBuffer.length

    return { compressedBuffer, originalSize, compressedSize }
  } finally {
    await cleanup(tempFiles)
  }
}
