import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_MODEL = "anthropic/claude-haiku-4-5"

const SYSTEM_PROMPT = `You are a translator for a personal Korean ramen blog.
You translate the author's casual Korean notes about ramen meals into:
- "en": natural conversational American English (keep the tone of the original text)
- "es": natural conversational Mexican Spanish (México, keep the tone of the original text; do NOT use "vosotros")

Rules:
- Preserve line breaks exactly as written.
- Keep proper nouns (shop names, dish names, neighborhoods) untranslated with their transcriptions in parentheses, unless there's an obvious English/Spanish equivalent.
- Keep the meaning faithful; do not add commentary, disclaimers, or quotation marks.
- Respond with a single JSON object: { "en": "...", "es": "..." }. No surrounding text.`

type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
  error?: { message?: string; code?: number | string }
}

/**
 * Some OpenRouter providers (notably Anthropic Claude) wrap JSON responses in
 * ```json ... ``` fences even when `response_format: { type: "json_object" }`
 * is requested. Strip an optional leading/trailing fence so JSON.parse can
 * handle the payload either way.
 */
function stripCodeFence(content: string): string {
  const trimmed = content.trim()
  // Match ``` or ```json (or ```JSON, etc.) on the opening fence, and a
  // closing ``` on its own at the end. Only strip when both sides match.
  const fenceMatch = /^```(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)\n?```\s*$/.exec(
    trimmed
  )
  return fenceMatch ? fenceMatch[1].trim() : trimmed
}

async function translateCommentRaw(
  korean: string
): Promise<{ en: string; es: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set in Convex env. Run: bunx convex env set OPENROUTER_API_KEY <key>"
    )
  }

  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // Optional but recommended by OpenRouter for analytics/abuse protection.
      "HTTP-Referer": "https://github.com/ropas/ramen-kiroku",
      "X-Title": "Ramen Kiroku",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: korean },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `OpenRouter translation failed (${response.status} ${response.statusText}): ${body}`
    )
  }

  const data = (await response.json()) as OpenRouterChatResponse

  if (data.error) {
    throw new Error(
      `OpenRouter translation error: ${data.error.message ?? "unknown error"}`
    )
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("OpenRouter returned no content")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stripCodeFence(content))
  } catch {
    throw new Error(
      `OpenRouter returned non-JSON content. First 200 chars: ${content.slice(0, 200)}`
    )
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as { en?: unknown }).en !== "string" ||
    typeof (parsed as { es?: unknown }).es !== "string"
  ) {
    throw new Error(
      `OpenRouter response did not match { en: string, es: string }: ${content.slice(0, 200)}`
    )
  }

  return {
    en: (parsed as { en: string }).en,
    es: (parsed as { es: string }).es,
  }
}

export const translateVisitComment = internalAction({
  args: { id: v.id("visits") },
  handler: async (ctx, { id }): Promise<void> => {
    const existing: { comment: string } | null = await ctx.runQuery(
      internal.visits.getForTranslation,
      { id }
    )
    if (!existing) return

    const source = existing.comment
    if (!source.trim()) return

    try {
      const { en, es } = await translateCommentRaw(source)
      await ctx.runMutation(internal.visits.setCommentTranslations, {
        id,
        source,
        en,
        es,
      })
    } catch (error) {
      await ctx.runMutation(internal.visits.markCommentTranslationError, {
        id,
      })
      console.error(
        "[translateVisitComment] failed for",
        id,
        error instanceof Error ? error.message : error
      )
      throw error
    }
  },
})

type BackfillTarget = {
  _id: Id<"visits">
  comment: string
}

type BackfillSummary = {
  succeeded: number
  failed: number
  skipped: number
  total: number
}

export const backfillCommentTranslations = internalAction({
  args: {},
  handler: async (ctx): Promise<BackfillSummary> => {
    const targets: BackfillTarget[] = await ctx.runQuery(
      internal.visits.listMissingCommentTranslations,
      {}
    )

    const summary: BackfillSummary = {
      succeeded: 0,
      failed: 0,
      skipped: 0,
      total: targets.length,
    }

    for (const visit of targets) {
      const source = visit.comment
      if (!source.trim()) {
        summary.skipped += 1
        continue
      }

      try {
        const { en, es } = await translateCommentRaw(source)
        await ctx.runMutation(internal.visits.setCommentTranslations, {
          id: visit._id,
          source,
          en,
          es,
        })
        summary.succeeded += 1
      } catch (error) {
        summary.failed += 1
        await ctx.runMutation(internal.visits.markCommentTranslationError, {
          id: visit._id,
        })
        console.error(
          "[backfillCommentTranslations] failed for",
          visit._id,
          error instanceof Error ? error.message : error
        )
      }

      // Be polite to OpenRouter / the upstream model provider.
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    console.log("[backfillCommentTranslations] summary:", summary)
    return summary
  },
})
