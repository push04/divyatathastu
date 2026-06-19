'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SudarshanLoader from '@/components/SudarshanLoader'

interface Module {
  id: string
  title: string
  description: string | null
  display_order: number
  is_active: boolean
  course_id: string
}

interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  lesson_type: 'youtube' | 'video' | 'pdf' | 'text'
  content_url: string | null
  content_text: string | null
  duration_minutes: number | null
  is_free_preview: boolean
  display_order: number
  is_active: boolean
}

const LESSON_TYPES = [
  { value: 'youtube', label: 'YouTube Video', icon: 'smart_display', color: '#FF0000' },
  { value: 'video',   label: 'Upload Video',  icon: 'videocam',      color: '#6366f1' },
  { value: 'pdf',     label: 'Upload PDF',    icon: 'picture_as_pdf', color: '#f97316' },
  { value: 'text',    label: 'Text Content',  icon: 'article',        color: '#10b981' },
] as const

const EMPTY_LESSON: Partial<Lesson> = {
  title: '', description: '', lesson_type: 'youtube',
  content_url: '', content_text: '', duration_minutes: undefined,
  is_free_preview: false, display_order: 0, is_active: true,
}

export default function CurriculumPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [courseName, setCourseName] = useState('')
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Module form
  const [moduleForm, setModuleForm] = useState<{ id?: string; title: string; description: string; display_order: number }>({ title: '', description: '', display_order: 0 })
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [savingModule, setSavingModule] = useState(false)

  // Lesson form
  const [lessonForm, setLessonForm] = useState<Partial<Lesson>>(EMPTY_LESSON)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null)
  const [savingLesson, setSavingLesson] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [courseRes, modulesRes, lessonsRes] = await Promise.all([
      (supabase as any).from('service_items').select('title').eq('id', courseId).single(),
      (supabase as any).from('course_modules').select('*').eq('course_id', courseId).order('display_order'),
      (supabase as any).from('course_lessons').select('*').eq('course_id', courseId).order('display_order'),
    ])
    if (courseRes.data) setCourseName(courseRes.data.title)
    if (modulesRes.data) {
      setModules(modulesRes.data as Module[])
      if (modulesRes.data.length > 0) setExpandedModules(new Set([modulesRes.data[0].id]))
    }
    if (lessonsRes.data) setLessons(lessonsRes.data as Lesson[])
    setLoading(false)
  }, [courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  // ── Module CRUD ──────────────────────────────────────────────────────────

  function openNewModule() {
    setEditingModule(null)
    setModuleForm({ title: '', description: '', display_order: modules.length })
    setShowModuleForm(true)
  }

  function openEditModule(m: Module) {
    setEditingModule(m)
    setModuleForm({ title: m.title, description: m.description || '', display_order: m.display_order })
    setShowModuleForm(true)
  }

  async function saveModule() {
    if (!moduleForm.title.trim()) { toast.error('Module title required'); return }
    setSavingModule(true)
    const payload = { course_id: courseId, title: moduleForm.title.trim(), description: moduleForm.description || null, display_order: moduleForm.display_order }
    let err: any
    if (editingModule) {
      const r = await (supabase as any).from('course_modules').update(payload).eq('id', editingModule.id)
      err = r.error
    } else {
      const r = await (supabase as any).from('course_modules').insert(payload)
      err = r.error
    }
    if (err) { toast.error(err.message); setSavingModule(false); return }
    toast.success(editingModule ? 'Module updated' : 'Module added')
    setShowModuleForm(false)
    await load()
    setSavingModule(false)
  }

  async function deleteModule(id: string) {
    if (!confirm('Delete this module and ALL its lessons?')) return
    await (supabase as any).from('course_modules').delete().eq('id', id)
    toast.success('Module deleted')
    await load()
  }

  // ── Lesson CRUD ──────────────────────────────────────────────────────────

  function openNewLesson(modId: string) {
    setEditingLesson(null)
    setTargetModuleId(modId)
    const count = lessons.filter(l => l.module_id === modId).length
    setLessonForm({ ...EMPTY_LESSON, display_order: count })
    setVideoFile(null); setPdfFile(null); setUploadProgress(0)
    setShowLessonForm(true)
  }

  function openEditLesson(l: Lesson) {
    setEditingLesson(l)
    setTargetModuleId(l.module_id)
    setLessonForm({ ...l })
    setVideoFile(null); setPdfFile(null); setUploadProgress(0)
    setShowLessonForm(true)
  }

  async function uploadCourseFile(file: File, type: 'video' | 'pdf'): Promise<string | null> {
    setUploadingFile(true); setUploadProgress(10)
    const bucket = type === 'video' ? 'course-videos' : 'course-pdfs'
    const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'pdf')
    const path = `${courseId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
    setUploadProgress(90)
    if (error) { toast.error('Upload failed: ' + error.message); setUploadingFile(false); return null }
    setUploadProgress(100)
    setUploadingFile(false)
    return path
  }

  async function saveLesson() {
    if (!lessonForm.title?.trim()) { toast.error('Lesson title required'); return }
    setSavingLesson(true)

    let contentUrl = lessonForm.content_url || null

    if (lessonForm.lesson_type === 'video' && videoFile) {
      contentUrl = await uploadCourseFile(videoFile, 'video')
      if (!contentUrl) { setSavingLesson(false); return }
    } else if (lessonForm.lesson_type === 'pdf' && pdfFile) {
      contentUrl = await uploadCourseFile(pdfFile, 'pdf')
      if (!contentUrl) { setSavingLesson(false); return }
    }

    const payload = {
      module_id: targetModuleId!,
      course_id: courseId,
      title: lessonForm.title!.trim(),
      description: lessonForm.description?.trim() || null,
      lesson_type: lessonForm.lesson_type,
      content_url: contentUrl,
      content_text: lessonForm.lesson_type === 'text' ? (lessonForm.content_text || null) : null,
      duration_minutes: lessonForm.duration_minutes || null,
      is_free_preview: !!lessonForm.is_free_preview,
      display_order: lessonForm.display_order || 0,
      is_active: true,
    }

    let err: any
    if (editingLesson) {
      const r = await (supabase as any).from('course_lessons').update(payload).eq('id', editingLesson.id)
      err = r.error
    } else {
      const r = await (supabase as any).from('course_lessons').insert(payload)
      err = r.error
    }
    if (err) { toast.error(err.message); setSavingLesson(false); return }
    toast.success(editingLesson ? 'Lesson updated' : 'Lesson added')
    setShowLessonForm(false)
    await load()
    setSavingLesson(false)
  }

  async function deleteLesson(id: string) {
    if (!confirm('Delete this lesson?')) return
    await (supabase as any).from('course_lessons').delete().eq('id', id)
    toast.success('Lesson deleted')
    await load()
  }

  async function toggleLessonActive(l: Lesson) {
    await (supabase as any).from('course_lessons').update({ is_active: !l.is_active }).eq('id', l.id)
    await load()
  }

  const typeConfig = (t: string) => LESSON_TYPES.find(x => x.value === t) || LESSON_TYPES[0]
  const sf = (k: keyof Lesson, v: any) => setLessonForm(f => ({ ...f, [k]: v }))

  if (loading) return (
    <div className="flex items-center justify-center h-64"><SudarshanLoader size="sm" /></div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Lesson Form Drawer ── */}
      {showLessonForm && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-800">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h2>
              <button onClick={() => setShowLessonForm(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-gray-500">close</span>
              </button>
            </div>

            <div className="flex-1 p-6 space-y-5">
              {/* Type selector */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Content Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LESSON_TYPES.map(lt => (
                    <button key={lt.value} onClick={() => sf('lesson_type', lt.value)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${lessonForm.lesson_type === lt.value ? 'border-[var(--indigo-deep)] bg-[var(--indigo-deep)]/5' : 'border-gray-200'}`}>
                      <span className="material-symbols-outlined text-[20px]" style={{ color: lt.color, fontVariationSettings: "'FILL' 1" }}>{lt.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">{lt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Lesson Title *</label>
                <input value={lessonForm.title || ''} onChange={e => sf('title', e.target.value)}
                  placeholder="e.g. Introduction to Lagna Chart"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
                <textarea value={lessonForm.description || ''} onChange={e => sf('description', e.target.value)}
                  rows={2} placeholder="Brief lesson summary"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] resize-none" />
              </div>

              {/* Content based on type */}
              {lessonForm.lesson_type === 'youtube' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">YouTube URL</label>
                  <input value={lessonForm.content_url || ''} onChange={e => sf('content_url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                  {lessonForm.content_url && lessonForm.content_url.includes('youtube') && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      YouTube URL detected
                    </p>
                  )}
                </div>
              )}

              {lessonForm.lesson_type === 'video' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Video File (MP4, WebM — max 500 MB)</label>
                  {editingLesson?.content_url && !videoFile && (
                    <p className="text-[11px] text-blue-600 mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
                      Video already uploaded. Choose a new file to replace it.
                    </p>
                  )}
                  <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={e => setVideoFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
                  {videoFile && (
                    <p className="text-[11px] text-gray-500 mt-1">{videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  )}
                  {uploadingFile && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--indigo-deep)] rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Uploading… {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              )}

              {lessonForm.lesson_type === 'pdf' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">PDF File (max 100 MB)</label>
                  {editingLesson?.content_url && !pdfFile && (
                    <p className="text-[11px] text-orange-600 mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                      PDF already uploaded. Choose a new file to replace it.
                    </p>
                  )}
                  <input type="file" accept="application/pdf"
                    onChange={e => setPdfFile(e.target.files?.[0] || null)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
                  {pdfFile && (
                    <p className="text-[11px] text-gray-500 mt-1">{pdfFile.name} · {(pdfFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  )}
                  {uploadingFile && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Uploading… {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              )}

              {lessonForm.lesson_type === 'text' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Text Content</label>
                  <textarea value={lessonForm.content_text || ''} onChange={e => sf('content_text', e.target.value)}
                    rows={10} placeholder="Write your lesson content here. Supports plain text — use blank lines for paragraphs."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] resize-y font-mono" />
                  <p className="text-[11px] text-gray-400 mt-1">{lessonForm.content_text?.length || 0} characters</p>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Duration (minutes)</label>
                  <input type="number" min={0} value={lessonForm.duration_minutes || ''} onChange={e => sf('duration_minutes', parseInt(e.target.value) || null)}
                    placeholder="e.g. 15"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Display Order</label>
                  <input type="number" min={0} value={lessonForm.display_order || 0} onChange={e => sf('display_order', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]" />
                </div>
              </div>

              <button onClick={() => sf('is_free_preview', !lessonForm.is_free_preview)}
                className={`flex items-center gap-2.5 w-full p-3 rounded-xl border-2 transition-all ${lessonForm.is_free_preview ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'}`}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: lessonForm.is_free_preview ? '#059669' : '#9ca3af', fontVariationSettings: "'FILL' 1" }}>
                  {lessonForm.is_free_preview ? 'lock_open' : 'lock'}
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-700">Free Preview</p>
                  <p className="text-[11px] text-gray-400">{lessonForm.is_free_preview ? 'Visible to all users without enrollment' : 'Only visible to enrolled students'}</p>
                </div>
              </button>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
              <button onClick={() => setShowLessonForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
              <button onClick={saveLesson} disabled={savingLesson || uploadingFile}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #4338ca)' }}>
                {savingLesson || uploadingFile ? <SudarshanLoader px={16} /> : null}
                {editingLesson ? 'Save Changes' : 'Add Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Module Form ── */}
      {showModuleForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModuleForm(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-800">{editingModule ? 'Edit Module' : 'Add Module'}</h3>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Module Title *</label>
              <input value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Foundations of Jyotish"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)]"
                autoFocus />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label>
              <textarea value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="What will students learn in this module?"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--indigo-deep)] resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Order</label>
              <input type="number" min={0} value={moduleForm.display_order}
                onChange={e => setModuleForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModuleForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500">Cancel</button>
              <button onClick={saveModule} disabled={savingModule}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #4338ca)' }}>
                {savingModule ? '…' : editingModule ? 'Save' : 'Add Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/courses" className="text-gray-400 hover:text-gray-700 transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <div>
              <p className="text-[11px] text-gray-400">Admin › Courses › Curriculum</p>
              <h1 className="font-bold text-gray-800 text-sm truncate max-w-[280px]">{courseName || 'Loading…'}</h1>
            </div>
          </div>
          <button onClick={openNewModule}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #4338ca)' }}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Module
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 pb-3 flex gap-5 text-sm">
          {[
            { n: modules.length, l: 'Modules' },
            { n: lessons.length, l: 'Lessons' },
            { n: lessons.filter(l => l.lesson_type === 'youtube').length, l: 'YouTube' },
            { n: lessons.filter(l => l.lesson_type === 'video').length, l: 'Videos' },
            { n: lessons.filter(l => l.lesson_type === 'pdf').length, l: 'PDFs' },
            { n: lessons.filter(l => l.is_free_preview).length, l: 'Free Preview' },
          ].map(s => (
            <div key={s.l} className="flex items-baseline gap-1">
              <span className="font-black text-[var(--indigo-deep)]">{s.n}</span>
              <span className="text-[11px] text-gray-400">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Curriculum ── */}
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {modules.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="material-symbols-outlined text-[52px] mb-3 block text-gray-200" style={{ fontVariationSettings: "'FILL' 0" }}>view_module</span>
            <p className="font-semibold mb-1">No modules yet</p>
            <p className="text-sm mb-5">Add a module (chapter) to organize your course content.</p>
            <button onClick={openNewModule} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #4338ca)' }}>
              Add First Module
            </button>
          </div>
        ) : modules.map((mod, mi) => {
          const modLessons = lessons.filter(l => l.module_id === mod.id).sort((a, b) => a.display_order - b.display_order)
          const isExpanded = expandedModules.has(mod.id)
          const toggleExpand = () => setExpandedModules(prev => {
            const next = new Set(prev)
            if (next.has(mod.id)) next.delete(mod.id)
            else next.add(mod.id)
            return next
          })

          return (
            <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Module header */}
              <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={toggleExpand}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black text-white"
                  style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #4338ca)' }}>
                  {mi + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm truncate">{mod.title}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{modLessons.length} lessons · {modLessons.reduce((s, l) => s + (l.duration_minutes || 0), 0)} min</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={e => { e.stopPropagation(); openEditModule(mod) }}
                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[14px] text-gray-500">edit</span>
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteModule(mod.id) }}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[14px] text-red-400">delete</span>
                  </button>
                  <span className={`material-symbols-outlined text-[20px] text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* Lessons */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {modLessons.map((l, li) => {
                    const tc = typeConfig(l.lesson_type)
                    return (
                      <div key={l.id} className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${!l.is_active ? 'opacity-50' : ''}`}>
                        <span className="text-[11px] text-gray-400 w-5 text-right font-mono flex-shrink-0">{li + 1}</span>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${tc.color}15` }}>
                          <span className="material-symbols-outlined text-[14px]" style={{ color: tc.color, fontVariationSettings: "'FILL' 1" }}>{tc.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-700 font-medium truncate">{l.title}</p>
                            {l.is_free_preview && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-bold uppercase tracking-wide flex-shrink-0">Free</span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400">{tc.label}{l.duration_minutes ? ` · ${l.duration_minutes} min` : ''}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEditLesson(l)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-[var(--indigo-deep)]/10 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[14px] text-gray-500">edit</span>
                          </button>
                          <button onClick={() => toggleLessonActive(l)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${l.is_active ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-gray-100 hover:bg-gray-200'}`}>
                            <span className="material-symbols-outlined text-[14px]" style={{ color: l.is_active ? '#059669' : '#9ca3af', fontVariationSettings: "'FILL' 1" }}>
                              {l.is_active ? 'visibility' : 'visibility_off'}
                            </span>
                          </button>
                          <button onClick={() => deleteLesson(l.id)}
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[14px] text-red-400">delete</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <div className="px-5 py-3">
                    <button onClick={() => openNewLesson(mod.id)}
                      className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-[var(--indigo-deep)] text-sm text-gray-400 hover:text-[var(--indigo-deep)] flex items-center justify-center gap-2 transition-all">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Add Lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {modules.length > 0 && (
          <button onClick={openNewModule}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-[var(--indigo-deep)] text-sm text-gray-400 hover:text-[var(--indigo-deep)] flex items-center justify-center gap-2 transition-all">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Another Module
          </button>
        )}
      </div>
    </div>
  )
}
