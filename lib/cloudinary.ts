import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const configuredCloudinary = cloudinary

export async function uploadProfilePhoto(
  dataUrl: string,
  userId: string
): Promise<{ secureUrl: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "cs-portal/profiles",
    public_id: `${userId}-${Date.now()}`,
    overwrite: true,
    resource_type: "image",
  })

  return { secureUrl: result.secure_url, publicId: result.public_id }
}

export async function deleteFile(cloudinaryUrl: string): Promise<void> {
  const rawMatch = cloudinaryUrl.match(/\/raw\/upload\/(?:[^\/]+\/)*v\d+\/(.+)/)
  if (rawMatch) {
    await cloudinary.uploader.destroy(rawMatch[1], { resource_type: "raw" })
    return
  }
  const imageMatch = cloudinaryUrl.match(/\/image\/upload\/(?:[^\/]+\/)*v\d+\/(.+)/)
  if (imageMatch) {
    const publicId = imageMatch[1].replace(/\.[^.]+$/, "")
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" })
  }
}

export async function destroyFile(publicId: string, resourceType: "raw" | "image" = "raw"): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

export async function uploadFile(
  dataUrl: string,
  publicId: string,
  folder: string,
  resourceType: "raw" | "image" = "raw"
): Promise<{ secureUrl: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: `cs-portal/${folder}`,
    public_id: publicId,
    resource_type: resourceType,
  })

  return { secureUrl: result.secure_url, publicId: result.public_id }
}

export async function uploadFileStream(
  buffer: Buffer,
  publicId: string,
  folder: string,
  resourceType: "raw" | "image" = "raw"
): Promise<{ secureUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `cs-portal/${folder}`,
        public_id: publicId,
        resource_type: resourceType,
        timeout: 120000,
      },
      (error, result) => {
        if (error) reject(error)
        else resolve({ secureUrl: result!.secure_url, publicId: result!.public_id })
      }
    )
    uploadStream.end(buffer)
  })
}

export async function uploadFileFromPath(
  filePath: string,
  publicId: string,
  folder: string,
  resourceType: "raw" | "image" = "raw"
): Promise<{ secureUrl: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `cs-portal/${folder}`,
    public_id: publicId,
    resource_type: resourceType,
    timeout: 120000,
  })
  return { secureUrl: result.secure_url, publicId: result.public_id }
}
