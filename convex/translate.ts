import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
const DEFAULT_MODEL = "anthropic/claude-haiku-4.5"
const EN_MARKER = "<<<EN>>>"
const ES_MARKER = "<<<ES>>>"
const END_MARKER = "<<<END>>>"

const SYSTEM_PROMPT = `You are a translator for a personal Korean ramen blog.
You translate the author's casual Korean notes about ramen meals into:
- "en": relaxed, natural conversational American English (keep the tone of the original text)
- "es": relaxed, natural Mexican/Latin American Spanish (keep the tone of the original text; do NOT use "vosotros")

Rules:
- Preserve line breaks exactly as written.
- Keep proper nouns (shop names, dish names, neighborhoods) untranslated with their transcriptions in parentheses, unless there's an obvious English/Spanish equivalent.
- Write like a casual first-person food blog, not formal review prose.
- Keep technical ramen terms natural and readable. It is okay to keep terms like shoyu, shio, chashu, ajitamago, menma, tsukedare, and wari untranslated when a translation would sound forced.
- Translate "비빔라멘" into "abura-soba", not "mazesoba", unless the original text specifically refers to a dish with noodles mixed with Taiwanese sauce.
- For "es", avoid stiff, academic, or Spain-leaning vocabulary. Prefer everyday Mexican/Latin American choices such as "carro" over "coche", "manejar" over "conducir", "estacionamiento" over "aparcamiento", and "mesero/a" over "camarero/a" when those ideas appear.
- Keep the meaning faithful; do not add commentary, disclaimers, or quotation marks.
- Do not return JSON. Do not escape quotes, apostrophes, backslashes, or line breaks.
- Return exactly this format, with no extra text before or after:
<<<EN>>>
English translation here
<<<ES>>>
Spanish translation here
<<<END>>>
- Do not include the markers inside either translation.`

type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
  error?: { message?: string; code?: number | string }
}

function stripOuterCodeFence(content: string): string {
  const trimmed = content.trim()
  const fenceMatch = /^```(?:[a-zA-Z0-9_-]+)?\s*\n([\s\S]*?)\n?```\s*$/.exec(
    trimmed
  )
  return fenceMatch ? fenceMatch[1].trim() : trimmed
}

function cleanDelimitedSection(section: string): string {
  return section
    .replace(/^\r?\n/, "")
    .replace(/\r?\n$/, "")
    .trim()
}

function parseDelimitedTranslations(content: string): {
  en: string
  es: string
} {
  const normalized = stripOuterCodeFence(content)
  const enStart = normalized.indexOf(EN_MARKER)
  const esStart = normalized.indexOf(ES_MARKER)
  const endStart = normalized.indexOf(END_MARKER)

  if (
    enStart < 0 ||
    esStart < 0 ||
    endStart < 0 ||
    !(enStart < esStart && esStart < endStart)
  ) {
    throw new Error(
      `OpenRouter response did not match translation markers. Content: ${content.slice(0, 500)}`
    )
  }

  const en = cleanDelimitedSection(
    normalized.slice(enStart + EN_MARKER.length, esStart)
  )
  const es = cleanDelimitedSection(
    normalized.slice(esStart + ES_MARKER.length, endStart)
  )

  if (!en || !es) {
    throw new Error(
      `OpenRouter response had empty translation section. Content: ${content.slice(0, 500)}`
    )
  }

  return { en, es }
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

  try {
    return parseDelimitedTranslations(content)
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : `OpenRouter response could not be parsed. Content: ${content.slice(0, 500)}`
    )
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
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<BackfillSummary> => {
    const targets: BackfillTarget[] = await ctx.runQuery(
      internal.visits.listMissingCommentTranslations,
      args.force === undefined ? {} : { force: args.force }
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
