import type { Metadata } from 'next'
import { Bebas_Neue } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import '../lib/styles/print-tokens.css'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const pretendard = localFont({
  src: [
    { path: '../sources/fonts/Pretendard-Regular.otf', weight: '400', style: 'normal' },
    { path: '../sources/fonts/Pretendard-Medium.otf', weight: '500', style: 'normal' },
    { path: '../sources/fonts/Pretendard-SemiBold.otf', weight: '600', style: 'normal' },
    { path: '../sources/fonts/Pretendard-Bold.otf', weight: '700', style: 'normal' },
    { path: '../sources/fonts/Pretendard-Black.otf', weight: '900', style: 'normal' },
  ],
  variable: '--font-pretendard',
})

export const metadata: Metadata = {
  title: 'CAI CANVAS | PRINT ver.3',
  description: 'N10 print — 건축 프로젝트 산출물 자동 포맷팅 서비스. CRE-TE CO.,LTD.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${bebas.variable} ${pretendard.variable}`}>
      <body className="bg-[--color-app-bg] text-[--color-text-primary] font-pretendard">
        {children}
      </body>
    </html>
  )
}