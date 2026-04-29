import { v } from "convex/values"

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import { requireOwner } from "./lib/auth"

const country = v.union(v.literal("JP"), v.literal("KR"))
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
const placeSort = v.union(v.literal("name_asc"), v.literal("created_desc"))

const shopFields = {
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
  wishlisted: v.optional(v.boolean()),
}

const wishlistShopFields = {
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

function assertShopUrls(shop: { googleMapsUrl?: string; tabelogUrl?: string }) {
  assertHttpsUrl(shop.googleMapsUrl, "Google Maps URL")
  assertHttpsUrl(shop.tabelogUrl, "Tabelog URL")
}

function matchesShopIdentity(
  shop: Doc<"shops">,
  args: {
    name: string
    country: "JP" | "KR"
    city: string
    area: string
  }
) {
  return (
    normalize(shop.name) === normalize(args.name) &&
    normalize(shop.area) === normalize(args.area) &&
    normalize(shop.city) === normalize(args.city) &&
    shop.country === args.country
  )
}

async function summarizeShop(ctx: QueryCtx, shop: Doc<"shops">) {
  const visits = await ctx.db
    .query("visits")
    .withIndex("by_shop", (q) => q.eq("shopId", shop._id))
    .collect()

  visits.sort((a: Doc<"visits">, b: Doc<"visits">) =>
    b.visitedOn.localeCompare(a.visitedOn)
  )

  const latestVisit = visits[0] ?? null
  const latestPhoto = latestVisit
    ? await ctx.db
        .query("photos")
        .withIndex("by_visit_and_sortOrder", (q) =>
          q.eq("visitId", latestVisit._id)
        )
        .first()
    : null

  return {
    ...shop,
    visitCount: visits.length,
    latestVisit,
    latestPhoto,
  }
}

function applyVisitFilters(
  visits: Doc<"visits">[],
  args: {
    style?: Doc<"visits">["style"]
    minRating?: number
    maxRating?: number
    fromDate?: string
    toDate?: string
    wouldRevisit?: boolean
  }
) {
  return visits.filter((visit) => {
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

function hasVisitFilters(args: {
  style?: Doc<"visits">["style"]
  minRating?: number
  maxRating?: number
  fromDate?: string
  toDate?: string
  wouldRevisit?: boolean
}) {
  return (
    args.style !== undefined ||
    args.minRating !== undefined ||
    args.maxRating !== undefined ||
    args.fromDate !== undefined ||
    args.toDate !== undefined ||
    args.wouldRevisit !== undefined
  )
}

function compareNullableNumbers(
  a: number | null,
  b: number | null,
  direction: "asc" | "desc"
) {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === "asc" ? a - b : b - a
}

function compareNullableDates(
  a: string | null,
  b: string | null,
  direction: "asc" | "desc"
) {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === "asc" ? a.localeCompare(b) : b.localeCompare(a)
}

async function summarizeBrowseShop(
  ctx: QueryCtx,
  shop: Doc<"shops">,
  args: {
    style?: Doc<"visits">["style"]
    minRating?: number
    maxRating?: number
    fromDate?: string
    toDate?: string
    wouldRevisit?: boolean
  }
) {
  const visits = await ctx.db
    .query("visits")
    .withIndex("by_shop", (q) => q.eq("shopId", shop._id))
    .collect()
  const filteredVisits = applyVisitFilters(visits, args)
  const visitFiltersActive = hasVisitFilters(args)
  const relevantVisits = visitFiltersActive ? filteredVisits : visits

  if (visitFiltersActive && relevantVisits.length === 0) return null

  relevantVisits.sort((a, b) => b.visitedOn.localeCompare(a.visitedOn))
  const latestVisit = relevantVisits[0] ?? null
  const latestPhoto = latestVisit
    ? await ctx.db
        .query("photos")
        .withIndex("by_visit_and_sortOrder", (q) =>
          q.eq("visitId", latestVisit._id)
        )
        .first()
    : null

  const ratings = relevantVisits.map((visit) => visit.ratingOverall)

  return {
    ...shop,
    visitCount: visits.length,
    latestVisit,
    latestPhoto,
    _sortVisitedOn: latestVisit?.visitedOn ?? null,
    _sortRating:
      ratings.length > 0
        ? {
            max: Math.max(...ratings),
            min: Math.min(...ratings),
          }
        : null,
  }
}

export const list = query({
  args: {
    country: v.optional(country),
    city: v.optional(v.string()),
    area: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let shops = await ctx.db.query("shops").collect()

    if (args.country)
      shops = shops.filter((shop) => shop.country === args.country)
    if (args.city) shops = shops.filter((shop) => shop.city === args.city)
    if (args.area) shops = shops.filter((shop) => shop.area === args.area)

    shops.sort((a, b) => a.name.localeCompare(b.name))

    return Promise.all(shops.map((shop) => summarizeShop(ctx, shop)))
  },
})

export const browse = query({
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
    let shops = await ctx.db.query("shops").collect()

    if (args.country)
      shops = shops.filter((shop) => shop.country === args.country)
    if (args.city) shops = shops.filter((shop) => shop.city === args.city)
    if (args.area) shops = shops.filter((shop) => shop.area === args.area)

    const summarized = (
      await Promise.all(
        shops.map((shop) => summarizeBrowseShop(ctx, shop, args))
      )
    ).filter((shop) => shop !== null)

    const sortBy = args.sort ?? "visitedOn_desc"
    summarized.sort((a, b) => {
      if (sortBy === "visitedOn_asc") {
        return (
          compareNullableDates(a._sortVisitedOn, b._sortVisitedOn, "asc") ||
          a.name.localeCompare(b.name)
        )
      }
      if (sortBy === "rating_desc") {
        return (
          compareNullableNumbers(
            a._sortRating?.max ?? null,
            b._sortRating?.max ?? null,
            "desc"
          ) || a.name.localeCompare(b.name)
        )
      }
      if (sortBy === "rating_asc") {
        return (
          compareNullableNumbers(
            a._sortRating?.min ?? null,
            b._sortRating?.min ?? null,
            "asc"
          ) || a.name.localeCompare(b.name)
        )
      }
      if (sortBy === "created_desc") {
        return b._creationTime - a._creationTime || a.name.localeCompare(b.name)
      }
      return (
        compareNullableDates(a._sortVisitedOn, b._sortVisitedOn, "desc") ||
        a.name.localeCompare(b.name)
      )
    })

    return summarized.map((shop) => ({
      _id: shop._id,
      _creationTime: shop._creationTime,
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
      wishlisted: shop.wishlisted,
      visitCount: shop.visitCount,
      latestVisit: shop.latestVisit,
      latestPhoto: shop.latestPhoto,
    }))
  },
})

export const wishlistBrowse = query({
  args: {
    country: v.optional(country),
    city: v.optional(v.string()),
    area: v.optional(v.string()),
    sort: v.optional(placeSort),
  },
  handler: async (ctx, args) => {
    let shops = (await ctx.db.query("shops").collect()).filter(
      (shop) => shop.wishlisted === true
    )

    if (args.country)
      shops = shops.filter((shop) => shop.country === args.country)
    if (args.city) shops = shops.filter((shop) => shop.city === args.city)
    if (args.area) shops = shops.filter((shop) => shop.area === args.area)

    const summarized = await Promise.all(
      shops.map((shop) => summarizeShop(ctx, shop))
    )

    const sortBy = args.sort ?? "name_asc"
    summarized.sort((a, b) => {
      if (sortBy === "created_desc") {
        return b._creationTime - a._creationTime || a.name.localeCompare(b.name)
      }
      return a.name.localeCompare(b.name)
    })

    return summarized.map((shop) => ({
      _id: shop._id,
      _creationTime: shop._creationTime,
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
      wishlisted: shop.wishlisted,
      visitCount: shop.visitCount,
      latestVisit: shop.latestVisit,
      latestPhoto: shop.latestPhoto,
    }))
  },
})

export const get = query({
  args: { id: v.id("shops") },
  handler: async (ctx, args) => {
    const shop = await ctx.db.get(args.id)
    if (!shop) return null

    const visits = await ctx.db
      .query("visits")
      .withIndex("by_shop", (q) => q.eq("shopId", args.id))
      .collect()

    const visitsWithPhotos = await Promise.all(
      visits
        .sort((a, b) => b.visitedOn.localeCompare(a.visitedOn))
        .map(async (visit) => {
          const firstPhoto = await ctx.db
            .query("photos")
            .withIndex("by_visit_and_sortOrder", (q) =>
              q.eq("visitId", visit._id)
            )
            .first()

          return { ...visit, firstPhoto }
        })
    )

    return { shop, visits: visitsWithPhotos }
  },
})

export const create = mutation({
  args: shopFields,
  handler: async (ctx, args) => {
    await requireOwner(ctx)
    assertShopUrls(args)
    return ctx.db.insert("shops", args)
  },
})

export const findOrCreate = mutation({
  args: shopFields,
  handler: async (ctx, args) => {
    await requireOwner(ctx)
    assertShopUrls(args)

    const existing = await ctx.db
      .query("shops")
      .withIndex("by_name_area", (q) =>
        q.eq("name", args.name).eq("area", args.area)
      )
      .collect()

    const match = existing.find((shop) => matchesShopIdentity(shop, args))

    if (match) return match._id

    return ctx.db.insert("shops", args)
  },
})

export const addToWishlist = mutation({
  args: wishlistShopFields,
  handler: async (ctx, args) => {
    await requireOwner(ctx)
    assertShopUrls(args)

    const existing = await ctx.db
      .query("shops")
      .withIndex("by_name_area", (q) =>
        q.eq("name", args.name).eq("area", args.area)
      )
      .collect()

    const match = existing.find((shop) => matchesShopIdentity(shop, args))

    if (match) {
      await ctx.db.patch(match._id, { ...args, wishlisted: true })
      return match._id
    }

    return ctx.db.insert("shops", { ...args, wishlisted: true })
  },
})

export const removeFromWishlist = mutation({
  args: { id: v.id("shops") },
  handler: async (ctx, args) => {
    await requireOwner(ctx)
    await ctx.db.patch(args.id, { wishlisted: false })
  },
})

export const update = mutation({
  args: {
    id: v.id("shops"),
    ...shopFields,
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx)

    const { id, ...patch } = args
    assertShopUrls(patch)
    await ctx.db.patch(id, patch)

    const visits = await ctx.db
      .query("visits")
      .withIndex("by_shop", (q) => q.eq("shopId", id as Id<"shops">))
      .collect()

    await Promise.all(
      visits.map((visit) =>
        ctx.db.patch(visit._id, {
          shopName: patch.name,
          shopNameJa: patch.nameJa,
          country: patch.country,
          city: patch.city,
          area: patch.area,
        })
      )
    )
  },
})

export const listMissingCoordinates = internalQuery({
  args: { country },
  handler: async (ctx, args) => {
    const shops = await ctx.db
      .query("shops")
      .withIndex("by_country_city", (q) => q.eq("country", args.country))
      .collect()

    return shops
      .filter(
        (shop): shop is Doc<"shops"> & { addressLine: string } =>
          shop.lat === undefined &&
          shop.lng === undefined &&
          typeof shop.addressLine === "string" &&
          shop.addressLine.trim().length > 0
      )
      .map((shop) => ({
        _id: shop._id,
        name: shop.name,
        area: shop.area,
        city: shop.city,
        addressLine: shop.addressLine,
      }))
  },
})

export const setCoordinates = internalMutation({
  args: {
    id: v.id("shops"),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lat: args.lat, lng: args.lng })
  },
})
