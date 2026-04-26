import { v } from "convex/values"
import { UTApi } from "uploadthing/server"

import { action, mutation, query } from "./_generated/server"
import { requireOwner } from "./lib/auth"

const photoInput = v.object({
  url: v.string(),
  key: v.string(),
  thumbUrl: v.string(),
  thumbKey: v.string(),
  width: v.number(),
  height: v.number(),
  sortOrder: v.number(),
})

export const listForVisit = query({
  args: { visitId: v.id("visits") },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_visit", (q) => q.eq("visitId", args.visitId))
      .collect()

    return photos.sort((a, b) => a.sortOrder - b.sortOrder)
  },
})

export const addToVisit = mutation({
  args: {
    visitId: v.id("visits"),
    photos: v.array(photoInput),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx)

    const visit = await ctx.db.get(args.visitId)
    if (!visit) throw new Error("Visit not found")

    const existing = await ctx.db
      .query("photos")
      .withIndex("by_visit", (q) => q.eq("visitId", args.visitId))
      .collect()
    const nextSortOrder =
      existing.length === 0
        ? 0
        : Math.max(...existing.map((photo) => photo.sortOrder)) + 1

    const inserted = await Promise.all(
      args.photos.map(async (photo, index) => {
        const id = await ctx.db.insert("photos", {
          visitId: args.visitId,
          ...photo,
          sortOrder: nextSortOrder + index,
        })
        const created = await ctx.db.get(id)
        if (!created) throw new Error("Unable to add photo")
        return created
      })
    )

    return inserted
  },
})

export const reorderForVisit = mutation({
  args: {
    visitId: v.id("visits"),
    photoIds: v.array(v.id("photos")),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx)

    const visit = await ctx.db.get(args.visitId)
    if (!visit) throw new Error("Visit not found")

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_visit", (q) => q.eq("visitId", args.visitId))
      .collect()
    const currentIds = new Set(photos.map((photo) => photo._id))
    const submittedIds = new Set(args.photoIds)

    if (
      currentIds.size !== args.photoIds.length ||
      currentIds.size !== submittedIds.size ||
      args.photoIds.some((id) => !currentIds.has(id))
    ) {
      throw new Error("Photo order is out of date. Reload and try again.")
    }

    await Promise.all(
      args.photoIds.map((photoId, sortOrder) =>
        ctx.db.patch(photoId, { sortOrder })
      )
    )
  },
})

export const removeFromVisit = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, args) => {
    await requireOwner(ctx)
    const photo = await ctx.db.get(args.photoId)
    if (!photo) return []

    const visit = await ctx.db.get(photo.visitId)
    if (!visit) throw new Error("Visit not found")

    await ctx.db.delete(args.photoId)
    const remaining = await ctx.db
      .query("photos")
      .withIndex("by_visit", (q) => q.eq("visitId", photo.visitId))
      .collect()
    remaining.sort((a, b) => a.sortOrder - b.sortOrder)
    await Promise.all(
      remaining.map((remainingPhoto, sortOrder) =>
        ctx.db.patch(remainingPhoto._id, { sortOrder })
      )
    )

    return [photo.key, photo.thumbKey]
  },
})

export const deleteUploadThingFiles = action({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireOwner(ctx)

    const keys = args.keys.filter(Boolean)
    if (keys.length === 0) return

    const token = process.env.UPLOADTHING_TOKEN
    if (!token) {
      throw new Error("UPLOADTHING_TOKEN is not configured")
    }

    const utapi = new UTApi({ token })
    const result = await utapi.deleteFiles(keys)

    if (!result.success) {
      throw new Error("UploadThing delete failed")
    }
  },
})
