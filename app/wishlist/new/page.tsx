import { ConvexAuthGate } from "@/components/convex-auth-gate"
import { WishlistShopForm } from "@/components/shop-form"

export const dynamic = "force-dynamic"

export default function NewWishlistPlacePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="font-heading text-4xl">Add place</h1>
        <p className="text-sm text-muted-foreground">
          Save a ramen shop to visit later.
        </p>
      </div>
      <ConvexAuthGate>
        <WishlistShopForm
          initial={{
            name: "",
            country: "KR",
            city: "",
            area: "",
          }}
        />
      </ConvexAuthGate>
    </main>
  )
}
