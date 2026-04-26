import type { ActionCtx, MutationCtx } from "../_generated/server"

export async function requireOwner(ctx: MutationCtx | ActionCtx) {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    throw new Error("Not authenticated")
  }

  if (identity.email !== process.env.OWNER_EMAIL) {
    throw new Error("Not authorized")
  }
}
