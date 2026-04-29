import { v } from "convex/values"

import { mutation, query, type MutationCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import { requireOwner } from "./lib/auth"

const country = v.union(v.literal("JP"), v.literal("KR"))
const currency = v.union(v.literal("JPY"), v.literal("KRW"))
const ramenStyle = v.union(
  v.literal("tonkotsu"),
  v.literal("shoyu"),
  v.literal("miso"),
  v.literal("shio"),
  v.literal("tsukemen"),
  v.literal("mazesoba"),
  v.literal("abura_soba"),
  v.literal("tantanmen"),
  v.literal("iekei"),
  v.literal("jiro"),
  v.literal("other")
)
const sort = v.union(
  v.literal("visitedOn_desc"),
  v.literal("visitedOn_asc"),
  v.literal("rating_desc"),
  v.literal("rating_asc"),
  v.literal("created_desc")
)

const shopInput = v.object({
  id: v.optional(v.id("shops")),
  name: v.string(),
  nameJa: v.optional(v.string()),
  country,
  city: v.string(),
  area: v.string(),
  addressLine: v.optional(v.string()),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
  googleMapsUrl: v.optional(v.string()),
  tabelogUrl: v.optional(v.string()),
})

const visitInput = {
  visitedOn: v.string(),
  bowlName: v.string(),
  style: ramenStyle,
  pricePaid: v.optional(v.number()),
  priceCurrency: v.optional(currency),
  noodleFirmness: v.optional(v.string()),
  noodleThickness: v.optional(v.string()),
  toppings: v.array(v.string()),
  ratingOverall: v.number(),
  ratingBroth: v.optional(v.number()),
  ratingNoodles: v.optional(v.number()),
  ratingToppings: v.optional(v.number()),
  wouldRevisit: v.boolean(),
  comment: v.string(),
}

const photoInput = v.object({
  url: v.string(),
  key: v.string(),
  thumbUrl: v.string(),
  thumbKey: v.string(),
  width: v.number(),
  height: v.number(),
  sortOrder: v.number(),
})

type ShopInput = {
  id?: Id<"shops">
  name: string
  nameJa?: string
  country: "JP" | "KR"
  city: string
  area: string
  addressLine?: string
  lat?: number
  lng?: number
  googleMapsUrl?: string
  tabelogUrl?: string
}

function assertRating(value: number | undefined, label: string) {
  if (value === undefined) return
  if (value < 1 || value > 10) {
    throw new Error(`${label} must be between 1 and 10`)
  }
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase()
}

function assertHttpsUrl(value: string | undefined, label: string) {
  if (!value) return

  try {
    const url = new URL(value)
    if (url.protocol === "https:") return
  } catch {
    // Fall through to the shared error below.
  }

  throw new Error(`${label} must be a valid https URL`)
}

function assertShopUrls(shop: ShopInput) {
  assertHttpsUrl(shop.googleMapsUrl, "Google Maps URL")
  assertHttpsUrl(shop.tabelogUrl, "Tabelog URL")
}

async function findOrCreateShop(ctx: MutationCtx, shop: ShopInput) {
  assertShopUrls(shop)

  if (shop.id) {
    const existing = await ctx.db.get(shop.id)
    if (!existing) throw new Error("Shop not found")
    if (existing.wishlisted === true) {
      await ctx.db.patch(existing._id, { wishlisted: false })
      return { ...existing, wishlisted: false }
    }
    return existing
  }

  const existing = await ctx.db
    .query("shops")
    .withIndex("by_name_area", (q) =>
      q.eq("name", shop.name).eq("area", shop.area)
    )
    .collect()

  const match = existing.find(
    (candidate: Doc<"shops">) =>
      normalize(candidate.name) === normalize(shop.name) &&
      normalize(candidate.area) === normalize(shop.area) &&
      normalize(candidate.city) === normalize(shop.city) &&
      candidate.country === shop.country
  )

  if (match) {
    if (match.wishlisted === true) {
      await ctx.db.patch(match._id, { wishlisted: false })
      return { ...match, wishlisted: false }
    }
    return match
  }

  const shopId = await ctx.db.insert("shops", {
    name: shop.name,
    nameJa: shop.nameJa,
    country: shop.country,
    city: shop.city,
    area: shop.area,
    addressLine: shop.addressLine,
    lat: shop.lat,
    lng: shop.lng,
    googleMapsUrl: shop.googleMapsUrl,
    tabelogUrl: shop.tabelogUrl,
  })

  const created = await ctx.db.get(shopId)
  if (!created) throw new Error("Unable to create shop")
  return created
}

function applyVisitFilters(
  visits: Doc<"visits">[],
  args: {
    country?: "JP" | "KR"
    city?: string
    area?: string
    style?: Doc<"visits">["style"]
    minRating?: number
    maxRating?: number
    fromDate?: string
    toDate?: string
    wouldRevisit?: boolean
  }
) {
  return visits.filter((visit) => {
    if (args.country && visit.country !== args.country) return false
    if (args.city && visit.city !== args.city) return false
    if (args.area && visit.area !== args.area) return false
    if (args.style && visit.style !== args.style) return false
    if (args.minRating !== undefined && visit.ratingOverall < args.minRating)
      return false
    if (args.maxRating !== undefined && visit.ratingOverall > args.maxRating)
      return false
    if (args.fromDate && visit.visitedOn < args.fromDate) return false
    if (args.toDate && visit.visitedOn > args.toDate) return false
    if (
      args.wouldRevisit !== undefined &&
      visit.wouldRevisit !== args.wouldRevisit
    )
      return false
    return true
  })
}

function sortVisits(visits: Doc<"visits">[], sortBy: string) {
  return [...visits].sort((a, b) => {
    if (sortBy === "visitedOn_asc")
      return a.visitedOn.localeCompare(b.visitedOn)
    if (sortBy === "rating_desc") return b.ratingOverall - a.ratingOverall
    if (sortBy === "rating_asc") return a.ratingOverall - b.ratingOverall
    if (sortBy === "created_desc") return b._creationTime - a._creationTime
    return b.visitedOn.localeCompare(a.visitedOn)
  })
}

export const list = query({
  args: {
    country: v.optional(country),
    city: v.optional(v.string()),
    area: v.optional(v.string()),
    style: v.optional(ramenStyle),
    minRating: v.optional(v.number()),
    maxRating: v.optional(v.number()),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
    wouldRevisit: v.optional(v.boolean()),
    sort: v.optional(sort),
  },
  handler: async (ctx, args) => {
    const sortBy = args.sort ?? "visitedOn_desc"
    const visits = sortVisits(
      applyVisitFilters(await ctx.db.query("visits").collect(), args),
      sortBy
    )

    return Promise.all(
      visits.map(async (visit) => {
        const firstPhoto = await ctx.db
          .query("photos")
          .withIndex("by_visit_and_sortOrder", (q) =>
            q.eq("visitId", visit._id)
          )
          .first()
        const shop = await ctx.db.get(visit.shopId)

        return { ...visit, firstPhoto, shop }
      })
    )
  },
})

export const get = query({
  args: { id: v.id("visits") },
  handler: async (ctx, args) => {
    const visit = await ctx.db.get(args.id)
    if (!visit) return null

    const [shop, photos] = await Promise.all([
      ctx.db.get(visit.shopId),
      ctx.db
        .query("photos")
        .withIndex("by_visit", (q) => q.eq("visitId", args.id))
        .collect(),
    ])

    photos.sort((a, b) => a.sortOrder - b.sortOrder)

    return { visit, shop, photos }
  },
})

export const createWithPhotos = mutation({
  args: {
    shop: shopInput,
    visit: v.object(visitInput),
    photos: v.array(photoInput),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx)

    assertRating(args.visit.ratingOverall, "Overall rating")
    assertRating(args.visit.ratingBroth, "Broth rating")
    assertRating(args.visit.ratingNoodles, "Noodles rating")
    assertRating(args.visit.ratingToppings, "Toppings rating")

    if (
      args.photos.some(
        (photo) =>
          !photo.url || !photo.thumbUrl || !photo.key || !photo.thumbKey
      )
    ) {
      throw new Error(
        "Every photo must include original and thumbnail upload refs"
      )
    }

    const shop = await findOrCreateShop(ctx, args.shop)

    const visitId = await ctx.db.insert("visits", {
      shopId: shop._id,
      shopName: shop.name,
      shopNameJa: shop.nameJa,
      country: shop.country,
      city: shop.city,
      area: shop.area,
      ...args.visit,
    })

    await Promise.all(
      args.photos.map((photo) =>
        ctx.db.insert("photos", {
          visitId,
          ...photo,
        })
      )
    )

    return visitId
  },
})

export const update = mutation({
  args: {
    id: v.id("visits"),
    shop: shopInput,
    visit: v.object(visitInput),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx)

    assertRating(args.visit.ratingOverall, "Overall rating")
    assertRating(args.visit.ratingBroth, "Broth rating")
    assertRating(args.visit.ratingNoodles, "Noodles rating")
    assertRating(args.visit.ratingToppings, "Toppings rating")

    const shop = await findOrCreateShop(ctx, args.shop)

    await ctx.db.patch(args.id, {
      shopId: shop._id,
      shopName: shop.name,
      shopNameJa: shop.nameJa,
      country: shop.country,
      city: shop.city,
      area: shop.area,
      ...args.visit,
    })
  },
})

export const remove = mutation({
  args: { id: v.id("visits") },
  handler: async (ctx, args) => {
    await requireOwner(ctx)

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_visit", (q) => q.eq("visitId", args.id))
      .collect()

    await Promise.all(photos.map((photo) => ctx.db.delete(photo._id)))
    await ctx.db.delete(args.id)

    return photos.flatMap((photo) => [photo.key, photo.thumbKey])
  },
})
