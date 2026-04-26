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
  RiSaveLine,
} from "@remixicon/react"
import { useAction, useMutation } from "convex/react"
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
  _id: Id<"photos">
}

export function PhotoManager({
  visitId,
  initialPhotos,
}: {
  visitId: Id<"visits">
  initialPhotos: ManagedPhoto[]
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [photos, setPhotos] = React.useState<ManagedPhoto[]>(initialPhotos)
  const [savedOrder, setSavedOrder] = React.useState(
    initialPhotos.map((photo) => photo._id).join(":")
  )
  const [isSavingOrder, setIsSavingOrder] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<Id<"photos"> | null>(null)
  const addToVisit = useMutation(api.photos.addToVisit)
  const reorderForVisit = useMutation(api.photos.reorderForVisit)
  const removeFromVisit = useMutation(api.photos.removeFromVisit)
  const deleteFiles = useAction(api.photos.deleteUploadThingFiles)
  const { uploadPhotos, busy, buttonLabel } = usePhotoUpload({
    successMessage: false,
  })
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const currentOrder = photos.map((photo) => photo._id).join(":")
  const hasOrderChanges = currentOrder !== savedOrder

  async function handleAdd(files: FileList | null) {
    const uploaded = await uploadPhotos(files, photos.length)
    if (inputRef.current) inputRef.current.value = ""
    if (!uploaded?.length) return

    try {
      const inserted = await addToVisit({ visitId, photos: uploaded })
      setPhotos((current) => [...current, ...inserted])
      setSavedOrder((current) =>
        [
          ...current.split(":").filter(Boolean),
          ...inserted.map((p) => p._id),
        ].join(":")
      )
      toast.success("Photos added")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add photos"
      toast.error(message)
    }
  }

  async function handleDelete(photo: ManagedPhoto) {
    if (!window.confirm("Delete this photo?")) return

    setDeletingId(photo._id)
    try {
      const keys = await removeFromVisit({ photoId: photo._id })
      setPhotos((current) => {
        const next = current.filter((item) => item._id !== photo._id)
        setSavedOrder(next.map((item) => item._id).join(":"))
        return next
      })
      try {
        await deleteFiles({ keys })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "UploadThing delete failed"
        toast.error(message)
      }
      toast.success("Photo deleted")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete photo"
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setPhotos((current) => {
      const oldIndex = current.findIndex((photo) => photo._id === active.id)
      const newIndex = current.findIndex((photo) => photo._id === over.id)
      if (oldIndex === -1 || newIndex === -1) return current
      return arrayMove(current, oldIndex, newIndex)
    })
  }

  function movePhoto(index: number, offset: number) {
    const nextIndex = index + offset
    if (nextIndex < 0 || nextIndex >= photos.length) return
    setPhotos((current) => arrayMove(current, index, nextIndex))
  }

  async function saveOrder() {
    setIsSavingOrder(true)
    try {
      const photoIds = photos.map((photo) => photo._id)
      await reorderForVisit({ visitId, photoIds })
      setSavedOrder(photoIds.join(":"))
      toast.success("Photo order saved")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save photo order"
      toast.error(message)
    } finally {
      setIsSavingOrder(false)
    }
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
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <RiImageAddLine />
            {buttonLabel}
          </Button>
          <Button
            type="button"
            disabled={!hasOrderChanges || isSavingOrder}
            onClick={() => void saveOrder()}
          >
            <RiSaveLine />
            {isSavingOrder ? "Saving" : "Save order"}
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
            items={photos.map((photo) => photo._id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <SortablePhoto
                  key={photo._id}
                  photo={photo}
                  index={index}
                  count={photos.length}
                  deleting={deletingId === photo._id}
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
  deleting,
  onMove,
  onDelete,
}: {
  photo: ManagedPhoto
  index: number
  count: number
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
  } = useSortable({ id: photo._id })
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
          disabled={index === 0}
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
          disabled={index === count - 1}
          onClick={() => onMove(index, 1)}
        >
          <RiArrowRightSLine />
          <span className="sr-only">Move photo right</span>
        </Button>
        <Button
          type="button"
          size="icon-xs"
          variant="destructive"
          disabled={deleting}
          onClick={onDelete}
        >
          <RiDeleteBinLine />
          <span className="sr-only">Delete photo</span>
        </Button>
      </div>
    </div>
  )
}
