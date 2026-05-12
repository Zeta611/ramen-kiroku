"use client"

import { useAction, useMutation } from "convex/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { OwnerOnly } from "@/components/owner-only"
import { Button } from "@/components/ui/button"

export function VisitActions({ visitId }: { visitId: Id<"visits"> }) {
  const router = useRouter()
  const removeVisit = useMutation(api.visits.remove)
  const deleteFiles = useAction(api.photoFiles.deleteUploadThingFiles)

  async function onDelete() {
    if (!window.confirm("Delete this visit and its photos?")) return

    try {
      const keys = await removeVisit({ id: visitId })
      await deleteFiles({ keys })
      toast.success("Visit deleted")
      router.push("/")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete visit"
      toast.error(message)
    }
  }

  return (
    <OwnerOnly>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={`/visit/${visitId}/edit`}>Edit</Link>
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => void onDelete()}
        >
          Delete
        </Button>
      </div>
    </OwnerOnly>
  )
}
