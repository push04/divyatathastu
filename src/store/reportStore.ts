import { create } from 'zustand'

interface Report {
  id: string
  report_type: string
  status: string
  created_at: string
  content?: any
  family_member_name?: string
}

interface ReportState {
  reports: Report[]
  currentReport: Report | null
  generating: boolean
  progress: number
  setReports: (reports: Report[]) => void
  addReport: (report: Report) => void
  updateReport: (id: string, update: Partial<Report>) => void
  setCurrentReport: (report: Report | null) => void
  setGenerating: (generating: boolean) => void
  setProgress: (progress: number) => void
}

export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  currentReport: null,
  generating: false,
  progress: 0,
  setReports: (reports) => set({ reports }),
  addReport: (report) => set(s => ({ reports: [report, ...s.reports] })),
  updateReport: (id, update) => set(s => ({
    reports: s.reports.map(r => r.id === id ? { ...r, ...update } : r),
    currentReport: s.currentReport?.id === id ? { ...s.currentReport, ...update } : s.currentReport,
  })),
  setCurrentReport: (report) => set({ currentReport: report }),
  setGenerating: (generating) => set({ generating }),
  setProgress: (progress) => set({ progress }),
}))
