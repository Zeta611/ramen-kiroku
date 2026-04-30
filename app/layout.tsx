import { ClerkProvider } from "@clerk/nextjs"
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin"
import { Geist_Mono, Noto_Sans, Playfair_Display } from "next/font/google"
import type { Viewport } from "next"
import { cookies, headers } from "next/headers"
import { extractRouterConfig } from "uploadthing/server"

import "./globals.css"
import { ourFileRouter } from "@/app/api/uploadthing/core"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { LocaleProvider } from "@/components/locale-provider"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import {
  detectFromAcceptLanguage,
  LOCALE_COOKIE,
  parseLocaleCookie,
} from "@/lib/locale"
import { cn } from "@/lib/utils"

const playfairDisplayHeading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
})

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1b18" },
  ],
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const locale =
    parseLocaleCookie(cookieStore.get(LOCALE_COOKIE)?.value) ??
    detectFromAcceptLanguage(headerStore.get("accept-language"))

  return (
    <ClerkProvider>
      <html
        lang={locale}
        suppressHydrationWarning
        className={cn(
          "antialiased",
          fontMono.variable,
          "font-sans",
          notoSans.variable,
          playfairDisplayHeading.variable
        )}
      >
        <body>
          <ThemeProvider>
            <ConvexClientProvider>
              <LocaleProvider initial={locale}>
                <NextSSRPlugin
                  routerConfig={extractRouterConfig(ourFileRouter)}
                />
                <SiteHeader />
                {children}
                <Toaster />
              </LocaleProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
