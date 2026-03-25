'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

export default function ResumeUploadPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf')
  const [file, setFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState('')
  const [title, setTitle] = useState('My Resume')
  const [isMaster, setIsMaster] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped)
      if (title === 'My Resume') setTitle(dropped.name.replace('.pdf', ''))
    } else {
      setError('Only PDF files are accepted')
    }
  }, [title])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setUploading(true)

    try {
      if (mode === 'pdf' && file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', title)
        formData.append('is_master', String(isMaster))
        await api.post('/resumes/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else if (mode === 'text' && rawText.trim().length >= 100) {
        const formData = new FormData()
        formData.append('raw_text', rawText)
        formData.append('title', title)
        formData.append('is_master', String(isMaster))
        await api.post('/resumes/text/', formData)
      } else {
        setError(mode === 'pdf' ? 'Please select a PDF file' : 'Resume text must be at least 100 characters')
        setUploading(false)
        return
      }
      router.push('/resumes')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Resume</h1>
        <p className="mt-1 text-sm text-gray-500">Upload a PDF or paste your resume text for AI analysis.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button type="button" onClick={() => setMode('pdf')} className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${mode === 'pdf' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            PDF Upload
          </button>
          <button type="button" onClick={() => setMode('text')} className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${mode === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Paste Text
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Resume Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Master Resume, Frontend Focus" />
        </div>

        {/* PDF drop zone */}
        {mode === 'pdf' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition ${dragOver ? 'border-blue-400 bg-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}
          >
            {file ? (
              <>
                <svg className="mb-3 h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                <p className="text-sm font-medium text-green-700">{file.name}</p>
                <p className="mt-1 text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button type="button" onClick={() => setFile(null)} className="mt-3 text-xs text-red-500 hover:text-red-700">Remove</button>
              </>
            ) : (
              <>
                <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                <p className="text-sm font-medium text-gray-700">Drag & drop your PDF here</p>
                <p className="mt-1 text-xs text-gray-500">or click to browse (max 10MB)</p>
                <input type="file" accept=".pdf,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); if (title === 'My Resume') setTitle(f.name.replace('.pdf', '')); } }} className="absolute inset-0 cursor-pointer opacity-0" />
              </>
            )}
          </div>
        )}

        {/* Text area */}
        {mode === 'text' && (
          <div>
            <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={12} className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Paste your full resume text here..." />
            <p className="mt-1 text-xs text-gray-400">{rawText.length} characters (min 100)</p>
          </div>
        )}

        {/* Master resume toggle */}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <input type="checkbox" checked={isMaster} onChange={(e) => setIsMaster(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">Set as Master Resume</p>
            <p className="text-xs text-gray-500">Your master resume is used as the primary source for AI matching</p>
          </div>
        </label>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Link href="/resumes" className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Processing...
              </>
            ) : 'Upload & Analyze'}
          </button>
        </div>
      </form>
    </div>
  )
}
