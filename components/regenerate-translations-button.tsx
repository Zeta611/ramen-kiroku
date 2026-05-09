"use client"

import { RiRefreshLine } from "@remixicon/react"
import { useMutation } from "convex/react"
import * as React from "react"
import { toast } from "sonner"

import { OwnerOnly } from "@/components/owner-only"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export function RegenerateTranslationsButton({
  visitId,
}: {
  visitId: Id<"visits">
}) {
  const regenerateTranslations = useMutation(
    api.visits.regenerateCommentTranslations
  )
  const [isPending, setIsPending] = React.useState(false)

  async function onRegenerate() {
    setIsPending(true)
    try {
      const result = await regenerateTranslations({ id: visitId })
      if (result.queued) {
        toast.success("Regenerating translations")
      } else {
        toast.message("No notes to translate")
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to regenerate translations"
      toast.error(message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <OwnerOnly>
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={isPending}
        onClick={() => void onRegenerate()}
      >
        <RiRefreshLine data-icon="inline-start" />
        {isPending ? "Regenerating" : "Regenerate"}
      </Button>
    </OwnerOnly>
  )
}
