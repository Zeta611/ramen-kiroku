"use client"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiDragMove2Line,
  RiImageAddLine,
} from "@remixicon/react"
import { useAction } from "convex/react"
import Image from "next/image"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { type UploadedPhoto, usePhotoUpload } from "@/components/photo-uploader"
import { cn } from "@/lib/utils"

export type ManagedPhoto = UploadedPhoto & {
  _id?: Id<"photos">
  draftId: string
}

export function PhotoManager({
  photos,
  onChange,
  disabled = false,
}: {
  photos: ManagedPhoto[]
  onChange: (photos: ManagedPhoto[]) => void
  disabled?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [deletingDraftId, setDeletingDraftId] = React.useState<string | null>(
    null
  )
  const deleteFiles = useAction(api.photoFiles.deleteUploadThingFiles)
  const { uploadPhotos, busy, buttonLabel } = usePhotoUpload({
    successMessage: false,
  })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function nextDraftPhoto(photo: UploadedPhoto): ManagedPhoto {
    return {
      ...photo,
      draftId: `upload:${photo.key}`,
    }
  }

  function publishPhotos(nextPhotos: ManagedPhoto[]) {
    onChange(
      nextPhotos.map((photo, sortOrder) => ({
        ...photo,
        sortOrder,
      }))
    )
  }

  async function handleAdd(files: FileList | null) {
    if (disabled) return

    const uploaded = await uploadPhotos(files, photos.length)
    if (inputRef.current) inputRef.current.value = ""
    if (!uploaded?.length) return

    publishPhotos([...photos, ...uploaded.map(nextDraftPhoto)])
    toast.success("Photos added")
  }

  async function handleDelete(photo: ManagedPhoto) {
    if (disabled) return

    setDeletingDraftId(photo.draftId)
    publishPhotos(photos.filter((item) => item.draftId !== photo.draftId))

    if (!photo._id) {
      try {
        await deleteFiles({ keys: [photo.key, photo.thumbKey] })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "UploadThing delete failed"
        toast.error(message)
      }
    }

    setDeletingDraftId(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    if (disabled) return

    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = photos.findIndex((photo) => photo.draftId === active.id)
    const newIndex = photos.findIndex((photo) => photo.draftId === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    publishPhotos(arrayMove(photos, oldIndex, newIndex))
  }

  function movePhoto(index: number, offset: number) {
    if (disabled) return

    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= photos.length) return
    publishPhotos(arrayMove(photos, index, nextIndex))
  }

  return (
    <section className="grid gap-4 border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl">Photos</h2>
          <p className="text-sm text-muted-foreground">
            Add, remove, and arrange photos for this visit.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            <RiImageAddLine data-icon="inline-start" />
            {buttonLabel}
          </Button>
        </div>
      </div>

      <Input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(event) => void handleAdd(event.target.files)}
      />

      {photos.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map((photo) => photo.draftId)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <SortablePhoto
                  key={photo.draftId}
                  photo={photo}
                  index={index}
                  count={photos.length}
                  disabled={disabled}
                  deleting={deletingDraftId === photo.draftId}
                  onMove={movePhoto}
                  onDelete={() => void handleDelete(photo)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid aspect-video place-items-center border border-dashed text-sm text-muted-foreground">
          No photos
        </div>
      )}
    </section>
  )
}

function SortablePhoto({
  photo,
  index,
  count,
  disabled,
  deleting,
  onMove,
  onDelete,
}: {
  photo: ManagedPhoto
  index: number
  count: number
  disabled: boolean
  deleting: boolean
  onMove: (index: number, offset: number) => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.draftId, disabled })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid gap-2 border bg-background p-2",
        isDragging && "z-10 opacity-70"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={photo.thumbUrl}
          alt={`Photo ${index + 1}`}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="flex items-center justify-between gap-1">
        <Button
          type="button"
          size="icon-xs"
          variant="outline"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, -1)}
        >
          <RiArrowLeftSLine />
          <span className="sr-only">Move photo left</span>
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="outline"
          className="cursor-grab active:cursor-grabbing"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <RiDragMove2Line />
          <span className="sr-only">Drag photo</span>
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="outline"
          disabled={disabled || index === count - 1}
          onClick={() => onMove(index, 1)}
        >
          <RiArrowRightSLine />
          <span className="sr-only">Move photo right</span>
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="destructive"
          disabled={disabled || deleting}
          onClick={onDelete}
        >
          <RiDeleteBinLine />
          <span className="sr-only">Delete photo</span>
        </Button>
      </div>
    </div>
  )
}
