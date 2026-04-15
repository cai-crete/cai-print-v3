import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Print',
  description: 'N10 — 건축 산출물 자동 포맷팅',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}