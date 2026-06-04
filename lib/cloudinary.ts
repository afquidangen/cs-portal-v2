import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadProfilePhoto(
  dataUrl: string,
  userId: string
): Promise<string> {
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "cs-portal/profiles",
    public_id: `${userId}-${Date.now()}`,
    overwrite: true,
    resource_type: "image",
  })

  return result.secure_url
}
