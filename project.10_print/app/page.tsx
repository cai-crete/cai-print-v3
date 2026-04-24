'use client'

import React from 'react'
import { PrintExpandedView } from '@/components/Print_ExpandedView'

export default function PrintPage() {
  return (
    <main className="w-full h-full min-h-screen bg-gray-50 flex flex-col">
      <PrintExpandedView />
    </main>
  )
}