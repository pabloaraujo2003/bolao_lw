import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bolão da Copa 2026',
  description: 'Faça seus palpites e dispute o prêmio com seus colegas',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  let profile = null
  if (session?.user) {
    const { data } = await supabase
      .from('profiles')
      .select('name, is_admin')
      .eq('id', session.user.id)
      .single()
    profile = data
  }

  return (
    <html lang="pt-BR">
      <body className={inter.className} style={{ background: '#0D1B2A', color: '#F0F4F8', minHeight: '100vh' }}>
        <Navbar user={session?.user ?? null} profile={profile} />
        <div className="max-w-5xl mx-auto px-4 pb-16">
          {children}
        </div>
      </body>
    </html>
  )
}
