export type QuickLinkRecord = {
  _id?: string
  label: string
  href: string
  type?: "link" | "file"
  fileName?: string
  fileSize?: number
  imageUrl?: string
  cloudinaryPublicId?: string
  createdAt?: string
  updatedAt?: string
}
