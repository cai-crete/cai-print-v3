/**
 * lib/saves.ts — 임시저장 문서 localStorage CRUD
 *
 * 저장소 키: n10_print_saves
 * 데이터 구조: SavedDocument[] (최신 순, index 0이 최신)
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

import type { SavedDocument } from './types'

const STORAGE_KEY = 'n10_print_saves'

/** 저장된 문서 목록 반환 (최신 순) */
export function savesGet(): SavedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedDocument[]) : []
  } catch {
    return []
  }
}

/** 문서 저장 — 동일 id 존재 시 덮어쓰기, 없으면 앞에 추가 */
export function savesSave(doc: SavedDocument): void {
  const docs = savesGet()
  const idx  = docs.findIndex((d) => d.id === doc.id)
  if (idx >= 0) {
    docs[idx] = doc
  } else {
    docs.unshift(doc)
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  } catch {
    // localStorage 용량 초과 등 무시
  }
}

/** id로 문서 삭제 */
export function savesDelete(id: string): void {
  const docs = savesGet().filter((d) => d.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  } catch {
    // ignore
  }
}
