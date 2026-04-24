/**
 * lib/imageUtils.ts — 클라이언트 사이드 이미지 압축 유틸리티
 *
 * 서버 업로드 전 이미지를 Canvas API로 리사이징·WebP 변환하여
 * 지정된 바이트 한도(maxBytes) 이하로 보장한다.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

/**
 * 이미지 파일을 WebP로 변환하며 maxBytes 이하로 압축한다.
 * 이미 한도 이하라면 원본을 그대로 반환한다.
 *
 * @param file      압축 대상 File 객체
 * @param maxBytes  허용 최대 바이트 (기본값: 2 * 1024 * 1024 = 2MB)
 * @returns         압축된 File (또는 원본)
 */
export async function compressImage(
  file: File,
  maxBytes: number = 2 * 1024 * 1024
): Promise<File> {
  // 이미 한도 이하면 원본 반환
  if (file.size <= maxBytes) return file

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width  = bitmap.width
  canvas.height = bitmap.height

  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0)

  // quality를 0.9 → 0.1 순서로 낮추며 maxBytes 이하 blob을 탐색
  for (let quality = 0.9; quality >= 0.1; quality = Math.round((quality - 0.1) * 10) / 10) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    )
    if (!blob) break
    if (blob.size <= maxBytes) {
      const baseName = file.name.replace(/\.[^.]+$/, '')
      return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
    }
  }

  // quality 루프 실패 시 해상도 절반 축소 후 재시도
  canvas.width  = Math.round(bitmap.width  / 2)
  canvas.height = Math.round(bitmap.height / 2)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const fallbackBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.7)
  )
  if (fallbackBlob && fallbackBlob.size <= maxBytes) {
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([fallbackBlob], `${baseName}.webp`, { type: 'image/webp' })
  }

  // 마지막 수단: 원본 반환 (서버에서 400 반환 가능성 있음)
  return file
}
