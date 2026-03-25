import { redirect } from 'next/navigation'

export default async function LoginRedirect(props: {
  searchParams: Promise<{ role?: string }>
}) {
  const searchParams = await props.searchParams
  const role = searchParams.role || 'student'
  const validRoles = ['student', 'recruiter', 'university']
  const targetRole = validRoles.includes(role) ? role : 'student'
  redirect(`/login/${targetRole}`)
}
