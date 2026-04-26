"use client"

import imageCompression from "browser-image-compression"
import { RiImageAddLine } from "@remixicon/react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUploadThing } from "@/lib/uploadthing"

const UPLOAD_TIMEOUT_MS = 120_000

export type UploadedPhoto = {
  url: string
  key: string
  thumbUrl: string
  thumbKey: string
  width: number
  height: number
  sortOrder: number
}

type UsePhotoUploadOptions = {
  onUploaded?: (photos: UploadedPhoto[]) => void
  successMessage?: string | false
}

type UploadResult = {
  url: string
  key: string
  name: string
}

function safeName(name: string) {
  const base = name.replace(/\.[^/.]+$/, "")
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "photo"
  )
}

function renameFile(file: File, name: string) {
  return new File([file], name, {
    type: file.type || "image/jpeg",
    lastModified: Date.now(),
  })
}

function looksLikeHeic(file: File) {
  const type = file.type.toLowerCase()
  if (type === "image/heic" || type === "image/heif") return true
  // Some browsers (notably Chrome on macOS) report HEIC files with an empty
  // type, so fall back to the extension.
  return /\.(heic|heif)$/i.test(file.name)
}

async function ensureRasterFormat(file: File): Promise<File> {
  // Quick gate by MIME/extension — avoids loading the libheif WASM bundle
  // for files that are obviously already JPEG/PNG/etc.
  if (!looksLikeHeic(file)) return file

  const { isHeic, heicTo } = await import("heic-to")
  // Header check: if the extension lied (e.g. .heic but actually a JPEG),
  // skip conversion and let imageCompression handle it.
  if (!(await isHeic(file))) return file

  const blob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.92,
  })
  const jpgName = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg"

  return new File([blob], jpgName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  })
}

async function getImageSize(file: File) {
  const url = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })

    return { width: image.naturalWidth, height: image.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function describeError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message
  }
  return fallback
}

export function usePhotoUpload(options: UsePhotoUploadOptions = {}) {
  const [isCompressing, setIsCompressing] = React.useState(false)
  const [uploadStatus, setUploadStatus] = React.useState<string | null>(null)
  const [uploadSignal, setUploadSignal] = React.useState<AbortSignal>()
  const uploadErrorRef = React.useRef<Error | null>(null)
  const uploadControllerRef = React.useRef<AbortController | null>(null)
  const { startUpload, isUploading } = useUploadThing("ramenPhoto", {
    signal: uploadSignal,
    onUploadBegin: () => {
      setUploadStatus("Uploading")
    },
    onUploadProgress: (progress) => {
      setUploadStatus(`Uploading ${progress}%`)
    },
    onUploadError: (error) => {
      uploadErrorRef.current = error
    },
  })

  async function uploadPhotos(files: FileList | File[] | null, sortOffset = 0) {
    if (!files?.length) return null

    const uploadController = new AbortController()
    uploadControllerRef.current?.abort()
    uploadControllerRef.current = uploadController
    setUploadSignal(uploadController.signal)
    setIsCompressing(true)
    setUploadStatus("Preparing")
    uploadErrorRef.current = null
    let uploadTimeout: number | undefined
    try {
      const selected = Array.from(files)
      const pairs = await Promise.all(
        selected.map(async (file, index) => {
          const decoded = await ensureRasterFormat(file)
          const name = safeName(decoded.name)
          const original = await imageCompression(decoded, {
            maxWidthOrHeight: 2048,
            maxSizeMB: 1,
            fileType: "image/jpeg",
            useWebWorker: true,
          })
          const thumb = await imageCompression(decoded, {
            maxWidthOrHeight: 800,
            maxSizeMB: 0.18,
            fileType: "image/jpeg",
            useWebWorker: true,
          })
          const size = await getImageSize(original)

          return {
            size,
            original: renameFile(original, `orig-${index}-${name}.jpg`),
            thumb: renameFile(thumb, `thumb-${index}-${name}.jpg`),
          }
        })
      )

      setUploadStatus("Starting upload")
      await new Promise((resolve) => requestAnimationFrame(resolve))
      uploadTimeout = window.setTimeout(() => {
        uploadController.abort()
      }, UPLOAD_TIMEOUT_MS)
      const uploaded = ((await startUpload(
        pairs.flatMap((pair) => [pair.original, pair.thumb])
      )) ?? []) as UploadResult[]
      if (uploadController.signal.aborted) {
        throw new Error(
          "Upload timed out. Check that the dev server is running on localhost:3000."
        )
      }
      if (uploadErrorRef.current) {
        throw uploadErrorRef.current
      }
      const nextPhotos = pairs.map((pair, index): UploadedPhoto => {
        const original = uploaded.find((file) =>
          file.name.startsWith(`orig-${index}-`)
        )
        const thumb = uploaded.find((file) =>
          file.name.startsWith(`thumb-${index}-`)
        )

        if (!original || !thumb) {
          throw new Error(
            "Upload completed without a matching original/thumb pair"
          )
        }

        return {
          url: original.url,
          key: original.key,
          thumbUrl: thumb.url,
          thumbKey: thumb.key,
          width: pair.size.width,
          height: pair.size.height,
          sortOrder: sortOffset + index,
        }
      })

      options.onUploaded?.(nextPhotos)
      if (options.successMessage !== false) {
        toast.success(options.successMessage ?? "Photos uploaded")
      }
      return nextPhotos
    } catch (error) {
      console.error("Photo upload failed", error)
      const message =
        uploadController.signal.aborted && !uploadErrorRef.current
          ? "Upload timed out. Check that the dev server is running on localhost:3000."
          : describeError(error, "Photo upload failed")
      toast.error(message)
      return null
    } finally {
      if (uploadTimeout) window.clearTimeout(uploadTimeout)
      setIsCompressing(false)
      setUploadStatus(null)
      if (uploadControllerRef.current === uploadController) {
        uploadControllerRef.current = null
      }
    }
  }

  const busy = isCompressing || isUploading
  const buttonLabel = busy ? (uploadStatus ?? "Working") : "Add"

  return { uploadPhotos, busy, buttonLabel }
}

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: UploadedPhoto[]
  onChange: (photos: UploadedPhoto[]) => void
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const { uploadPhotos, busy, buttonLabel } = usePhotoUpload({
    onUploaded: (nextPhotos) => onChange([...photos, ...nextPhotos]),
  })

  async function handleFiles(files: FileList | null) {
    await uploadPhotos(files, photos.length)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Photos
          </label>
          <p className="text-xs text-muted-foreground">
            Uploads a 2048px original and 800px thumbnail.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <RiImageAddLine />
          {buttonLabel}
        </Button>
      </div>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div
              key={`${photo.key}-${photo.thumbKey}`}
              className="relative aspect-square overflow-hidden border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbUrl}
                alt={`Uploaded ramen ${index + 1}`}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
