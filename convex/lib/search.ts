type VisitSearchInput = {
  shopName: string
  shopNameJa?: string
  bowlName: string
  comment: string
  commentEn?: string
  commentEs?: string
  toppings: string[]
}

// Hangul syllables, hiragana, katakana, and CJK ideographs. Convex's tokenizer
// splits on whitespace only, so without help it sees "특선쇼유라멘" as a single
// indivisible token. Expanding each CJK run into all 2-char bigrams gives
// substring-style matching for searches like "라멘" inside "특선쇼유라멘".
const CJK_RUN = /[぀-ゟ゠-ヿ一-鿿가-힯]+/g

export function expandCjkBigrams(text: string): string {
  return text.replace(CJK_RUN, (run) => {
    if (run.length <= 2) return run
    const grams: string[] = [run]
    for (let i = 0; i < run.length - 1; i++) {
      grams.push(run.slice(i, i + 2))
    }
    return grams.join(" ")
  })
}

export function buildVisitSearchText(visit: VisitSearchInput): string {
  const raw = [
    visit.shopName,
    visit.shopNameJa,
    visit.bowlName,
    visit.comment,
    visit.commentEn,
    visit.commentEs,
    ...visit.toppings,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
  return expandCjkBigrams(raw)
}
