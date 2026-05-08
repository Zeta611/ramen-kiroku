import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server"
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server"

const SOURCE_HOST = "ramen.jaylee.xyz"
const CANONICAL_HOST = "ramen-kiroku.jaylee.xyz"

const isOwnerOnlyRoute = createRouteMatcher([
  "/new(.*)",
  "/shops/(.*)/edit(.*)",
  "/visit/(.*)/edit(.*)",
])

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (!isOwnerOnlyRoute(req)) return

  const session = await auth()
  if (!session.userId) {
    return session.redirectToSignIn()
  }

  // `currentUser()` uses Next.js' server-component request context, which
  // doesn't exist inside middleware — calling it here triggers the
  // "auth() can't detect clerkMiddleware()" error. The low-level
  // `clerkClient` works in any runtime, so we fetch the user directly
  // by id and read their primary email.
  const client = await clerkClient()
  const user = await client.users.getUser(session.userId)
  const email = user.primaryEmailAddress?.emailAddress
  if (email !== process.env.OWNER_EMAIL) {
    return new Response("Forbidden (Clerk)", { status: 403 })
  }
})

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const host = req.headers.get("x-forwarded-host") ?? req.nextUrl.host
  // Forward requests to `ramen.jaylee.xyz` to `ramen-kiroku.jaylee.xyz`
  if (host === SOURCE_HOST) {
    const canonicalUrl = req.nextUrl.clone()
    canonicalUrl.host = CANONICAL_HOST
    return NextResponse.redirect(canonicalUrl, 308)
  }

  return clerkHandler(req, event)
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
