import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="grid min-h-[calc(100svh-3.5rem)] place-items-center px-4 py-8">
      <SignIn />
    </main>
  )
}
