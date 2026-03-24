'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ResumesPage() {
  const queryClient = useQueryClient()

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => api.get('/resumes').then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resumes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] })
      toast.success('Resume deleted')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Resumes</h1>
        <Link
          href="/resumes/upload"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Upload Resume
        </Link>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : resumes?.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-500">No resumes yet. Upload your first one to get started.</p>
          <Link
            href="/resumes/upload"
            className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white"
          >
            Upload Resume
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes?.map((resume: any) => (
            <div key={resume.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{resume.title}</p>
                  {resume.file_name && (
                    <p className="mt-0.5 text-xs text-gray-400">{resume.file_name}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {resume.is_master && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                        Master
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        resume.processing_status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : resume.processing_status === 'processing'
                            ? 'bg-yellow-100 text-yellow-700'
                            : resume.processing_status === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {resume.processing_status}
                    </span>
                  </div>

                  {/* Extracted skills preview */}
                  {resume.parsed_data?.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {resume.parsed_data.skills.slice(0, 5).map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {skill}
                        </span>
                      ))}
                      {resume.parsed_data.skills.length > 5 && (
                        <span className="text-xs text-gray-400">
                          +{resume.parsed_data.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/match?resume=${resume.id}`}
                  className="flex-1 rounded-lg bg-brand-50 py-2 text-center text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  Analyze Match
                </Link>
                <button
                  onClick={() => deleteMutation.mutate(resume.id)}
                  className="rounded-lg px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
