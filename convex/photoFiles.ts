"use node"

import { v } from "convex/values"

import { action } from "./_generated/server"
import { requireOwner } from "./lib/auth"

const UPLOADTHING_API_URL = "https://api.uploadthing.com"
const UPLOADTHING_VERSION = "7.7.4"

function decodeTokenApiKey(token: string) {
  const trimmed = token.trim()
  if (trimmed.startsWith("sk_")) return trimmed

  for (const encoding of ["base64", "base64url"] as const) {
    try {
      const decoded = JSON.parse(Buffer.from(trimmed, encoding).toString("utf8"))
      if (
        decoded &&
        typeof decoded === "object" &&
        "apiKey" in decoded &&
        typeof decoded.apiKey === "string" &&
        decoded.apiKey.startsWith("sk_")
      ) {
        return decoded.apiKey
      }
    } catch {
      // Try the next supported token encoding.
    }
  }

  return null
}

function getUploadThingApiKey() {
  const token = process.env.UPLOADTHING_TOKEN
  if (token) return decodeTokenApiKey(token)

  const apiKey = process.env.UPLOADTHING_API_KEY ?? process.env.UPLOADTHING_SECRET
  if (apiKey?.trim().startsWith("sk_")) return apiKey.trim()

  return null
}

async function readResponseBody(response: Response) {
  try {
    return await response.text()
  } catch {
    return ""
  }
}

export const deleteUploadThingFiles = action({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireOwner(ctx)

    const keys = args.keys.filter(Boolean)
    if (keys.length === 0) return

    const apiKey = getUploadThingApiKey()
    if (!apiKey) {
      console.warn(
        "UploadThing delete skipped: set UPLOADTHING_TOKEN to a v7 token or UPLOADTHING_API_KEY to an sk_ API key"
      )
      return { success: false, deletedCount: 0, skipped: true }
    }

    const response = await fetch(`${UPLOADTHING_API_URL}/v6/deleteFiles`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-uploadthing-api-key": apiKey,
        "x-uploadthing-version": UPLOADTHING_VERSION,
      },
      body: JSON.stringify({ fileKeys: keys }),
    })

    if (!response.ok) {
      const body = await readResponseBody(response)
      console.warn(
        `UploadThing delete failed with HTTP ${response.status}: ${body}`
      )
      return { success: false, deletedCount: 0, skipped: false }
    }

    const result = (await response.json()) as {
      success?: unknown
      deletedCount?: unknown
    }

    return {
      success: result.success === true,
      deletedCount:
        typeof result.deletedCount === "number" ? result.deletedCount : 0,
      skipped: false,
    }
  },
})
