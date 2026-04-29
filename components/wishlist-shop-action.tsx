"use client"

import { RiCloseLine } from "@remixicon/react"
import { useMutation } from "convex/react"
import * as React from "react"
import { toast } from "sonner"

import { OwnerOnly } from "@/components/owner-only"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export function WishlistShopAction({ shopId }: { shopId: string }) {
  const removeFromWishlist = useMutation(api.shops.removeFromWishlist)
  const [isRemoving, setIsRemoving] = React.useState(false)

  async function onRemove() {
    setIsRemoving(true)
    try {
      await removeFromWishlist({ id: shopId as Id<"shops"> })
      toast.success("Removed from wishlist")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to remove place"
      toast.error(message)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <OwnerOnly>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRemove}
        disabled={isRemoving}
      >
        <RiCloseLine data-icon="inline-start" />
        {isRemoving ? "Removing" : "Remove"}
      </Button>
    </OwnerOnly>
  )
}
