import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { getCachedProfile } from '@/lib/cache'

export const metadata: Metadata = {
  title: 'Bolão da Copa 2026',
  description: 'Faça seus palpites e dispute o prêmio com seus colegas',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  let profile = null
  if (session?.user) {
    profile = await getCachedProfile(session.user.id)
  }

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar user={session?.user ?? null} profile={profile} />
        <div className="main-content max-w-5xl mx-auto px-4 pb-20">
          {children}
        </div>
      </body>
    </html>
  )
}
