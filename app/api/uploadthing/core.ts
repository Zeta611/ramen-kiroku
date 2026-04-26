import { auth, currentUser } from "@clerk/nextjs/server"
import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

const f = createUploadthing()

function uploadedUrl(file: { ufsUrl?: string; url?: string }) {
  return file.ufsUrl ?? file.url ?? ""
}

export const ourFileRouter = {
  ramenPhoto: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 20,
    },
  })
    .middleware(async () => {
      const session = await auth()

      if (!session.userId) {
        throw new UploadThingError("Unauthorized")
      }

      // `sessionClaims.email` is only populated when the Clerk JWT template
      // has been customized to include it, so we resolve the primary email
      // from the user record instead — that field is always present.
      const user = await currentUser()
      const email = user?.primaryEmailAddress?.emailAddress

      if (email !== process.env.OWNER_EMAIL) {
        throw new UploadThingError("Forbidden")
      }

      return { userId: session.userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: uploadedUrl(file),
        key: file.key,
        name: file.name,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
