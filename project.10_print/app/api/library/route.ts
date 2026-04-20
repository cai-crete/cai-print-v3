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
    return NextResponse.json({ folders: [] as LibraryFolder[], rootImages: [] as LibraryImage[] })
  }

  const entries = fs.readdirSync(LIBRARY_DIR, { withFileTypes: true })
  const folderEntries = entries.filter((e) => e.isDirectory())
  const fileEntries   = entries.filter((e) => !e.isDirectory() && IMAGE_EXTS.has(path.extname(e.name).toLowerCase()))

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

  // 최상단 루트에 존재하는 낱장 이미지 풀
  const rootImages: LibraryImage[] = fileEntries.map((fileObj, idx) => {
    const file = fileObj.name
    // folder= 없이 file= 만 전달 시 최상위 폴더 기준으로 접근하도록 구조 개선이 필요할 수도 있지만,
    // 현재 이미지 처리 라우터가 "folder"를 필수로 요구하므로, folder 매개변수 처리를 위해 빈 문자열을 넘김
    const imageUrl = `/api/library/image?file=${encodeURIComponent(file)}`
    return {
      id:           `ROOT__${idx}__${file}`,
      name:         file,
      url:          imageUrl,
      category:     'A' as const,
      thumbnailUrl: imageUrl,
    }
  })

  return NextResponse.json({ folders, rootImages })
}
