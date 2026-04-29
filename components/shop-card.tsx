import Image from "next/image"
import Link from "next/link"

type ShopCardProps = {
  shop: {
    _id: string
    name: string
    city: string
    area: string
    visitCount: number
    latestPhoto?: { thumbUrl: string; width: number; height: number } | null
  }
}

export function ShopCard({ shop }: ShopCardProps) {
  return (
    <Link
      href={`/shops/${shop._id}`}
      className="grid grid-cols-[96px_1fr] overflow-hidden border bg-card"
    >
      <div className="relative aspect-square bg-muted">
        {shop.latestPhoto ? (
          <Image
            src={shop.latestPhoto.thumbUrl}
            alt={shop.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="grid content-between gap-3 p-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{shop.name}</h2>
          <p className="truncate text-sm text-muted-foreground">
            {shop.area}, {shop.city}
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {shop.visitCount} visits
        </p>
      </div>
    </Link>
  )
}
