"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import type { Area, Point } from "react-easy-crop"
import { Crop, ZoomIn, ZoomOut } from "lucide-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = url
    img.onload = () => resolve(img)
    img.onerror = reject
  })
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  return canvas.toDataURL("image/jpeg", 0.95)
}

type ImageCropDialogProps = {
  imageSrc: string
  open: boolean
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
  aspect?: number
  cropShape?: "round" | "rect"
}

export function ImageCropDialog({
  imageSrc,
  open,
  onConfirm,
  onCancel,
  aspect = 1,
  cropShape = "round",
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [applying, setApplying] = useState(false)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  async function handleApply() {
    if (!croppedAreaPixels) return
    setApplying(true)
    try {
      const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels)
      onConfirm(croppedDataUrl)
    } catch {
      onConfirm(imageSrc)
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="size-4" />
            Crop Photo
          </DialogTitle>
        </DialogHeader>

        <div className="relative mx-auto h-80 w-full overflow-hidden rounded-lg bg-black/10">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            restrictPosition
          />
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="size-4 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
          />
          <ZoomIn className="size-4 text-muted-foreground" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={applying}>
            {applying ? "Applying..." : "Apply"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
