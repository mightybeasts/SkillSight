import { redirect } from 'next/navigation'

export default async function LoginRedirect() {
  redirect('/login/recruiter')
}
