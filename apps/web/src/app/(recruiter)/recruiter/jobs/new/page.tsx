'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

export default function NewJobPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<{ skill_name: string; is_required: boolean }[]>([])

  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    is_remote: false,
    job_type: 'full_time',
    experience_level: 'mid',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
  })

  function updateForm(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addSkill() {
    const name = skillInput.trim()
    if (name && !skills.find(s => s.skill_name.toLowerCase() === name.toLowerCase())) {
      setSkills(prev => [...prev, { skill_name: name, is_required: true }])
      setSkillInput('')
    }
  }

  function removeSkill(name: string) {
    setSkills(prev => prev.filter(s => s.skill_name !== name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.company || !form.description) {
      setError('Title, company, and description are required')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await api.post('/jobs/', {
        ...form,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        skills: skills.map(s => ({ skill_name: s.skill_name, skill_category: 'technical', is_required: s.is_required, importance_weight: s.is_required ? 1.0 : 0.5 })),
      })
      router.push('/recruiter/jobs')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create job listing')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/recruiter/jobs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
          Back to Jobs
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Post New Job</h1>
        <p className="mt-1 text-sm text-gray-500">AI will auto-extract skills and generate embeddings for semantic matching.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600">Job Title *</label>
              <input type="text" value={form.title} onChange={e => updateForm('title', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="e.g. Senior Full Stack Engineer" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600">Company *</label>
              <input type="text" value={form.company} onChange={e => updateForm('company', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="e.g. TechCorp Inc." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Location</label>
              <input type="text" value={form.location} onChange={e => updateForm('location', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="e.g. San Francisco, CA" />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5">
                <input type="checkbox" checked={form.is_remote} onChange={e => updateForm('is_remote', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-purple-600" />
                <span className="text-sm text-gray-700">Remote</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Job Type</label>
              <select value={form.job_type} onChange={e => updateForm('job_type', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500">
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Experience Level</label>
              <select value={form.experience_level} onChange={e => updateForm('experience_level', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500">
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Min Salary</label>
              <input type="number" value={form.salary_min} onChange={e => updateForm('salary_min', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="80000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Max Salary</label>
              <input type="number" value={form.salary_max} onChange={e => updateForm('salary_max', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="130000" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Details</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600">Description *</label>
            <textarea value={form.description} onChange={e => updateForm('description', e.target.value)} rows={4} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="Describe the role..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Requirements</label>
            <textarea value={form.requirements} onChange={e => updateForm('requirements', e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="List qualifications..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Responsibilities</label>
            <textarea value={form.responsibilities} onChange={e => updateForm('responsibilities', e.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="Day-to-day tasks..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Benefits</label>
            <textarea value={form.benefits} onChange={e => updateForm('benefits', e.target.value)} rows={2} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="Perks & benefits..." />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Required Skills</h2>
          <div className="flex gap-2">
            <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="Type a skill and press Enter" />
            <button type="button" onClick={addSkill} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">Add</button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map(s => (
                <span key={s.skill_name} className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                  {s.skill_name}
                  <button type="button" onClick={() => removeSkill(s.skill_name)} className="ml-1 text-purple-400 hover:text-purple-700">&times;</button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400">Leave empty and AI will auto-extract skills from the description.</p>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="flex items-center justify-between">
          <Link href="/recruiter/jobs" className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-60">
            {submitting ? 'Creating...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  )
}
