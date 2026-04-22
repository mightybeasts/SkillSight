'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

interface Job {
  id: string
  title: string
  company: string
  location: string | null
  is_remote: boolean
  job_type: string
  experience_level: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  description: string
  requirements: string | null
  responsibilities: string | null
  benefits: string | null
  status: string
}

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance']
const EXPERIENCE_LEVELS = ['entry', 'junior', 'mid', 'senior', 'lead', 'principal']
const STATUSES = ['active', 'draft', 'closed']

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const jobId = params.id

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Job | null>(null)

  useEffect(() => {
    if (!jobId) return
    setLoading(true)
    api.get(`/jobs/${jobId}`)
      .then((res) => {
        setJob(res.data)
        setForm(res.data)
      })
      .catch(() => setError('Failed to load job.'))
      .finally(() => setLoading(false))
  }, [jobId])

  const onField = <K extends keyof Job>(key: K, value: Job[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const save = async () => {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const payload: Partial<Job> = {
        title: form.title,
        company: form.company,
        location: form.location,
        is_remote: form.is_remote,
        job_type: form.job_type,
        experience_level: form.experience_level,
        salary_min: form.salary_min,
        salary_max: form.salary_max,
        salary_currency: form.salary_currency,
        description: form.description,
        requirements: form.requirements,
        responsibilities: form.responsibilities,
        benefits: form.benefits,
        status: form.status,
      }
      const res = await api.patch(`/jobs/${jobId}`, payload)
      setJob(res.data)
      setForm(res.data)
      setEditing(false)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('Delete this job? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/jobs/${jobId}`)
      router.push('/recruiter/jobs')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Delete failed.')
      setDeleting(false)
    }
  }

  const cancelEdit = () => {
    setForm(job)
    setEditing(false)
    setError(null)
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
  }

  if (!job || !form) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
        <p className="text-sm text-gray-600">{error || 'Job not found.'}</p>
        <Link href="/recruiter/jobs" className="mt-3 inline-block text-sm font-medium text-purple-600 hover:text-purple-700">← Back to jobs</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/recruiter/jobs" className="text-xs font-medium text-gray-500 hover:text-gray-700">← Back to jobs</Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{job.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{job.company} &middot; {job.location || 'Remote'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/recruiter/jobs/${jobId}/candidates`}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            View Candidates
          </Link>
          {!editing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          )}
          {editing && (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Overview grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Job Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" value={form.title} editing={editing} onChange={(v) => onField('title', v)} />
          <Field label="Company" value={form.company} editing={editing} onChange={(v) => onField('company', v)} />
          <Field label="Location" value={form.location || ''} editing={editing} onChange={(v) => onField('location', v)} />
          <SelectField label="Status" value={form.status} options={STATUSES} editing={editing} onChange={(v) => onField('status', v)} />
          <SelectField label="Job Type" value={form.job_type} options={JOB_TYPES} editing={editing} onChange={(v) => onField('job_type', v)} format={(s) => s.replace('_', ' ')} />
          <SelectField label="Experience Level" value={form.experience_level} options={EXPERIENCE_LEVELS} editing={editing} onChange={(v) => onField('experience_level', v)} />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Remote</label>
            {editing ? (
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_remote}
                  onChange={(e) => onField('is_remote', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Remote-friendly
              </label>
            ) : (
              <p className="text-sm text-gray-900">{form.is_remote ? 'Yes' : 'No'}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">Salary Range</label>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.salary_min ?? ''}
                  onChange={(e) => onField('salary_min', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Min"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="number"
                  value={form.salary_max ?? ''}
                  onChange={(e) => onField('salary_max', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Max"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={form.salary_currency}
                  onChange={(e) => onField('salary_currency', e.target.value)}
                  className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-900">
                {form.salary_min != null && form.salary_max != null
                  ? `${form.salary_currency} ${form.salary_min.toLocaleString()} – ${form.salary_max.toLocaleString()}`
                  : '—'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Long-text fields */}
      <TextBlock label="Description" value={form.description} editing={editing} onChange={(v) => onField('description', v)} rows={6} />
      <TextBlock label="Requirements" value={form.requirements || ''} editing={editing} onChange={(v) => onField('requirements', v)} rows={4} />
      <TextBlock label="Responsibilities" value={form.responsibilities || ''} editing={editing} onChange={(v) => onField('responsibilities', v)} rows={4} />
      <TextBlock label="Benefits" value={form.benefits || ''} editing={editing} onChange={(v) => onField('benefits', v)} rows={3} />
    </div>
  )
}

function Field({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-500">{label}</label>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      ) : (
        <p className="text-sm text-gray-900">{value || '—'}</p>
      )}
    </div>
  )
}

function SelectField({
  label, value, options, editing, onChange, format,
}: { label: string; value: string; options: string[]; editing: boolean; onChange: (v: string) => void; format?: (s: string) => string }) {
  const display = format ? format(value) : value
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-500">{label}</label>
      {editing ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {options.map((o) => (
            <option key={o} value={o}>{format ? format(o) : o}</option>
          ))}
        </select>
      ) : (
        <p className="text-sm capitalize text-gray-900">{display || '—'}</p>
      )}
    </div>
  )
}

function TextBlock({ label, value, editing, onChange, rows }: { label: string; value: string; editing: boolean; onChange: (v: string) => void; rows: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-gray-900">{label}</h2>
      {editing ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      ) : value ? (
        <p className="whitespace-pre-wrap text-sm text-gray-700">{value}</p>
      ) : (
        <p className="text-sm italic text-gray-400">Not provided</p>
      )}
    </div>
  )
}
