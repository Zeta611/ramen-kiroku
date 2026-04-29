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

    const match = existing.find(
      (shop) =>
        normalize(shop.name) === normalize(args.name) &&
        normalize(shop.area) === normalize(args.area) &&
        normalize(shop.city) === normalize(args.city) &&
        shop.country === args.country
    )

    if (match) return match._id

    return ctx.db.insert("shops", args)
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
