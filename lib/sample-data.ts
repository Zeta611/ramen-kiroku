import type { RamenStyle } from "@/lib/ramen"

export type SamplePhoto = {
  _id: string
  thumbUrl: string
  url: string
  width: number
  height: number
}

export type SampleVisit = {
  _id: string
  _creationTime: number
  shopId: string
  shopName: string
  shopNameJa?: string
  country: "JP" | "KR"
  city: string
  area: string
  visitedOn: string
  bowlName: string
  style: RamenStyle
  pricePaid?: number
  priceCurrency?: "JPY" | "KRW"
  noodleFirmness?: string
  noodleThickness?: string
  toppings: string[]
  ratingOverall: number
  ratingBroth?: number
  ratingNoodles?: number
  ratingToppings?: number
  wouldRevisit: boolean
  comment: string
  firstPhoto: SamplePhoto
  photos: SamplePhoto[]
}

export type SampleShop = {
  _id: string
  name: string
  nameJa?: string
  country: "JP" | "KR"
  city: string
  area: string
  addressLine?: string
  googleMapsUrl?: string
  tabelogUrl?: string
}

const tonkotsuPhoto: SamplePhoto = {
  _id: "sample-photo-tonkotsu",
  thumbUrl:
    "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=500&q=80",
  url: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=1600&q=85",
  width: 1600,
  height: 1600,
}

const tsukemenPhoto: SamplePhoto = {
  _id: "sample-photo-tsukemen",
  thumbUrl:
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80",
  url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1600&q=85",
  width: 1600,
  height: 1600,
}

export const SAMPLE_SHOPS: SampleShop[] = [
  {
    _id: "sample-shop-hongdae",
    name: "Showa Menjo",
    nameJa: "昭和麺所",
    country: "KR",
    city: "Seoul",
    area: "Hongdae",
    addressLine: "Sample address near Hongik University",
    googleMapsUrl: "https://maps.google.com",
  },
  {
    _id: "sample-shop-ebisu",
    name: "Menya Ebisu",
    nameJa: "麺屋 恵比寿",
    country: "JP",
    city: "Tokyo",
    area: "Ebisu",
    addressLine: "Sample address near Ebisu Station",
    tabelogUrl: "https://tabelog.com",
  },
]

export const SAMPLE_VISITS: SampleVisit[] = [
  {
    _id: "sample-visit-tonkotsu",
    _creationTime: Date.parse("2026-04-18"),
    shopId: "sample-shop-hongdae",
    shopName: "Showa Menjo",
    shopNameJa: "昭和麺所",
    country: "KR",
    city: "Seoul",
    area: "Hongdae",
    visitedOn: "2026-04-18",
    bowlName: "Tonkotsu Shoyu",
    style: "shoyu",
    pricePaid: 12000,
    priceCurrency: "KRW",
    noodleFirmness: "katame",
    noodleThickness: "medium",
    toppings: ["ajitama", "chashu x2", "nori"],
    ratingOverall: 8,
    ratingBroth: 8,
    ratingNoodles: 7,
    ratingToppings: 8,
    wouldRevisit: true,
    comment:
      "Balanced soy-forward bowl with a clean pork base. Good ajitama, slightly soft noodles, but the finish made it an easy revisit.",
    firstPhoto: tonkotsuPhoto,
    photos: [tonkotsuPhoto],
  },
  {
    _id: "sample-visit-tsukemen",
    _creationTime: Date.parse("2026-04-25"),
    shopId: "sample-shop-ebisu",
    shopName: "Menya Ebisu",
    shopNameJa: "麺屋 恵比寿",
    country: "JP",
    city: "Tokyo",
    area: "Ebisu",
    visitedOn: "2026-04-25",
    bowlName: "Gyokai Tsukemen",
    style: "tsukemen",
    pricePaid: 1180,
    priceCurrency: "JPY",
    noodleFirmness: "futsuu",
    noodleThickness: "thick",
    toppings: ["menma", "chashu", "negi"],
    ratingOverall: 9,
    ratingBroth: 9,
    ratingNoodles: 9,
    ratingToppings: 8,
    wouldRevisit: true,
    comment:
      "Dense seafood dipping broth with chewy thick noodles. The kind of bowl that should sort to the top before a Tokyo return visit.",
    firstPhoto: tsukemenPhoto,
    photos: [tsukemenPhoto],
  },
]

export function usingSampleData() {
  return !process.env.NEXT_PUBLIC_CONVEX_URL
}

export function getSampleVisit(id: string) {
  return SAMPLE_VISITS.find((visit) => visit._id === id) ?? null
}

export function getSampleShop(id: string) {
  const shop = SAMPLE_SHOPS.find((candidate) => candidate._id === id)
  if (!shop) return null

  return {
    shop,
    visits: SAMPLE_VISITS.filter((visit) => visit.shopId === id),
  }
}
