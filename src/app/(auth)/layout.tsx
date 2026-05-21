import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--kutch-white)]">
      <header className="h-16 border-b border-[var(--warm-sand)] flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-saffron flex items-center justify-center text-white font-bold text-sm">ॐ</div>
          <span className="font-bold text-[var(--indigo-deep)]">DivyaTathastu</span>
        </Link>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
