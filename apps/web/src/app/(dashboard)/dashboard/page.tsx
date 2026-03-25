'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { formatScore, getScoreColor } from '@/lib/utils'

export default function DashboardPage() {
  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data),
  })

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs?limit=6').then((r) => r.data),
  })

  const resumeCount = resumes?.length ?? 0
  const completedResumes = resumes?.filter((r: any) => r.processing_status === 'completed')?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of your job search activity and AI insights.</p>
        </div>
        <Link
          href="/resumes/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-student-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-student-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Upload Resume
        </Link>
      </div>

      {/* Stats cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Resumes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{resumeCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-student-50">
              <svg className="h-6 w-6 text-student-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="font-medium text-green-600">{completedResumes} analyzed</span>
            <span className="text-gray-400">by AI</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Job Matches</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="text-gray-400">Upload a resume to start matching</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Match Score</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="text-gray-400">Based on semantic analysis</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Applications</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <span className="text-gray-400">Across all job listings</span>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions — left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
              <Link
                href="/resumes/upload"
                className="group flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition hover:border-student-300 hover:bg-student-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-student-100 text-student-600 transition group-hover:bg-student-200">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Upload Resume</p>
                  <p className="mt-1 text-xs text-gray-500">PDF or paste text</p>
                </div>
              </Link>

              <Link
                href="/match"
                className="group flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition hover:border-purple-300 hover:bg-purple-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition group-hover:bg-purple-200">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">AI Job Match</p>
                  <p className="mt-1 text-xs text-gray-500">Analyze fit for a role</p>
                </div>
              </Link>

              <Link
                href="/jobs"
                className="group flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition hover:border-green-300 hover:bg-green-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 transition group-hover:bg-green-200">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Browse Jobs</p>
                  <p className="mt-1 text-xs text-gray-500">Explore opportunities</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Your Resumes */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Your Resumes</h2>
              <Link href="/resumes" className="text-sm font-medium text-student-600 hover:text-student-700">
                View all
              </Link>
            </div>
            <div className="p-6">
              {resumesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
                  ))}
                </div>
              ) : resumeCount === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">No resumes uploaded yet</p>
                  <p className="mt-1 text-xs text-gray-500">Upload your first resume to get AI-powered insights</p>
                  <Link
                    href="/resumes/upload"
                    className="mt-4 inline-flex items-center gap-1 rounded-lg bg-student-600 px-4 py-2 text-sm font-medium text-white hover:bg-student-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Upload Resume
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {resumes?.slice(0, 4).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-student-50">
                          <svg className="h-5 w-5 text-student-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {r.is_master && (
                              <span className="rounded bg-student-100 px-1.5 py-0.5 text-[10px] font-semibold text-student-700">
                                MASTER
                              </span>
                            )}
                            <span className="text-xs text-gray-400">{r.file_name || 'Text input'}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          r.processing_status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : r.processing_status === 'processing'
                              ? 'bg-yellow-50 text-yellow-700'
                              : r.processing_status === 'failed'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {r.processing_status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Insights card */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-student-600 via-student-700 to-student-900 p-6 text-white">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-student-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
              <h3 className="text-sm font-semibold text-student-100">AI Insights</h3>
            </div>
            <p className="text-2xl font-bold">Get Started</p>
            <p className="mt-2 text-sm text-student-200">
              Upload your resume to unlock AI-powered job matching, skill gap analysis, and personalized learning recommendations.
            </p>
            <Link
              href="/resumes/upload"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/30"
            >
              Start Analysis
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Latest Jobs */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Latest Jobs</h2>
              <Link href="/jobs" className="text-sm font-medium text-student-600 hover:text-student-700">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {!jobs?.length ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-400">No jobs available yet.</p>
                  <p className="mt-1 text-xs text-gray-400">Check back later for new listings.</p>
                </div>
              ) : (
                jobs.slice(0, 5).map((job: any) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-gray-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                      {job.company?.[0]?.toUpperCase() || 'J'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{job.title}</p>
                      <p className="truncate text-xs text-gray-500">{job.company} · {job.location || 'Remote'}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600">
                      {job.job_type?.replace('_', ' ')}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* How It Works mini */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900">How SkillSight Works</h3>
            <div className="mt-4 space-y-4">
              {[
                { step: '1', title: 'Upload', desc: 'Add your resume (PDF or text)', color: 'bg-student-600' },
                { step: '2', title: 'Analyze', desc: 'AI extracts skills & experience', color: 'bg-purple-600' },
                { step: '3', title: 'Match', desc: 'Get transparent job match scores', color: 'bg-green-600' },
                { step: '4', title: 'Grow', desc: 'Close skill gaps with learning paths', color: 'bg-orange-500' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${item.color}`}>
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
