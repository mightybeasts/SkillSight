import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) =>
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            ),
        },
      },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // If user doesn't have a role set, they're new — set them as recruiter
      const isNewUser = !data.user.user_metadata?.role
      if (isNewUser) {
        await supabase.auth.updateUser({ data: { role: 'recruiter' } })
      }
      return NextResponse.redirect(`${origin}/recruiter/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
