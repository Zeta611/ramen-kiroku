import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server"

const isOwnerOnlyRoute = createRouteMatcher([
  "/new(.*)",
  "/shops/(.*)/edit(.*)",
  "/visit/(.*)/edit(.*)",
])

export default clerkMiddleware(async (auth, req) => {
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
    return new Response("Forbidden", { status: 403 })
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
