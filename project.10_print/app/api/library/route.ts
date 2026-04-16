/**
 * GET /api/library
 * sources/library/ 디렉터리를 스캔하여 LibraryFolder[] JSON 반환.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { LibraryFolder, LibraryImage } from '@/lib/types'

const LIBRARY_DIR = path.join(process.cwd(), 'sources', 'library')
const IMAGE_EXTS   = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

export async function GET() {
  if (!fs.existsSync(LIBRARY_DIR)) {
    return NextResponse.json([] as LibraryFolder[])
  }

  const entries = fs.readdirSync(LIBRARY_DIR, { withFileTypes: true })
  const folderEntries = entries.filter((e) => e.isDirectory())

  const folders: LibraryFolder[] = folderEntries.map((dir) => {
    const folderPath = path.join(LIBRARY_DIR, dir.name)
    const files = fs.readdirSync(folderPath).filter(
      (f) => IMAGE_EXTS.has(path.extname(f).toLowerCase())
    )

    const images: LibraryImage[] = files.map((file, idx) => {
      const imageUrl =
        `/api/library/image?folder=${encodeURIComponent(dir.name)}&file=${encodeURIComponent(file)}`
      return {
        id:           `${dir.name}__${idx}__${file}`,
        name:         file,
        url:          imageUrl,
        category:     'A' as const,
        thumbnailUrl: imageUrl,
      }
    })

    return {
      id:        dir.name,
      name:      dir.name,
      images,
      createdAt: new Date().toISOString(),
    }
  })

  return NextResponse.json(folders)
}
