import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const country = v.union(v.literal("JP"), v.literal("KR"))
const currency = v.union(v.literal("JPY"), v.literal("KRW"))
const ramenStyle = v.union(
  v.literal("tonkotsu"),
  v.literal("shoyu"),
  v.literal("miso"),
  v.literal("shio"),
  v.literal("niboshi"),
  v.literal("tsukemen"),
  v.literal("mazesoba"),
  v.literal("abura_soba"),
  v.literal("tantanmen"),
  v.literal("iekei"),
  v.literal("jiro"),
  v.literal("other")
)

export default defineSchema({
  shops: defineTable({
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
  })
    .index("by_country_city", ["country", "city"])
    .index("by_area", ["area"])
    .index("by_name_area", ["name", "area"]),

  visits: defineTable({
    shopId: v.id("shops"),
    shopName: v.string(),
    shopNameJa: v.optional(v.string()),
    country,
    city: v.string(),
    area: v.string(),
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
    commentEn: v.optional(v.string()),
    commentEs: v.optional(v.string()),
    // Exact KO snapshot that produced the current translations. Lets us cheaply
    // detect drift in the backfill job without hashing.
    commentTranslatedFrom: v.optional(v.string()),
    commentTranslationStatus: v.optional(
      v.union(v.literal("pending"), v.literal("error"))
    ),
    searchText: v.optional(v.string()),
  })
    .index("by_visitedOn", ["visitedOn"])
    .index("by_shop", ["shopId"])
    .index("by_style", ["style"])
    .index("by_rating", ["ratingOverall"])
    .index("by_country_city", ["country", "city"])
    .index("by_area", ["area"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["country", "city", "area", "style", "wouldRevisit"],
    }),

  photos: defineTable({
    visitId: v.id("visits"),
    url: v.string(),
    key: v.string(),
    thumbUrl: v.string(),
    thumbKey: v.string(),
    width: v.number(),
    height: v.number(),
    sortOrder: v.number(),
  })
    .index("by_visit", ["visitId"])
    .index("by_visit_and_sortOrder", ["visitId", "sortOrder"]),
})
