import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const ROLE_DASHBOARDS: Record<string, string> = {
  student: '/dashboard',
  recruiter: '/recruiter/dashboard',
  university: '/university/dashboard',
  job_seeker: '/dashboard',
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') || 'student'

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
      const isNewUser = !data.user.user_metadata?.role
      if (isNewUser) {
        return NextResponse.redirect(`${origin}/onboarding?role=${role}`)
      }

      const userRole = data.user.user_metadata?.role || role
      const dashboard = ROLE_DASHBOARDS[userRole] || '/dashboard'
      return NextResponse.redirect(`${origin}${dashboard}`)
    }
  }

  return NextResponse.redirect(`${origin}/login/student?error=auth_failed`)
}
