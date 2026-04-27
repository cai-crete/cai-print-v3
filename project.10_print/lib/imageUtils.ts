/**
 * lib/imageUtils.ts — 클라이언트 사이드 이미지 압축 유틸리티
 *
 * 서버 업로드 전 이미지를 Canvas API로 리사이징하여
 * 지정된 바이트 한도(maxBytes) 이하로 보장한다.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

/**
 * 이미지 파일을 JPEG로 압축하여 maxBytes 이하로 보장한다.
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
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )
    if (!blob) break
    if (blob.size <= maxBytes) {
      const baseName = file.name.replace(/\.[^.]+$/, '')
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
    }
  }

  // quality 루프 실패 시 해상도 절반 축소 후 재시도
  canvas.width  = Math.round(bitmap.width  / 2)
  canvas.height = Math.round(bitmap.height / 2)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const fallbackBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.7)
  )
  if (fallbackBlob && fallbackBlob.size <= maxBytes) {
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([fallbackBlob], `${baseName}.jpg`, { type: 'image/jpeg' })
  }

  // 마지막 수단: 원본 반환 (서버에서 400 반환 가능성 있음)
  return file
}

/**
 * 이미지를 16:9 비율로 중앙 크롭한다.
 * 이미 16:9 비율(2% 오차 이내)이라면 원본을 그대로 반환한다.
 * VIDEO 모드에서 fal.ai Kling O3 제출 전 적용된다.
 *
 * @param file  크롭 대상 File 객체
 * @returns     16:9 크롭된 File (또는 원본)
 */
export async function centerCropTo16by9(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const targetRatio = 16 / 9
  const srcRatio = width / height

  // 이미 16:9 비율이면 원본 반환 (2% 오차 허용)
  if (Math.abs(srcRatio - targetRatio) / targetRatio < 0.02) return file

  let sw: number, sh: number, sx: number, sy: number
  if (srcRatio > targetRatio) {
    // 원본이 더 넓음 → 좌우를 크롭
    sh = height
    sw = Math.round(height * targetRatio)
    sx = Math.round((width - sw) / 2)
    sy = 0
  } else {
    // 원본이 더 높음 → 상하를 크롭
    sw = width
    sh = Math.round(width / targetRatio)
    sx = 0
    sy = Math.round((height - sh) / 2)
  }

  const canvas = document.createElement('canvas')
  canvas.width  = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.92)
  )
  if (!blob) return file
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const ext = mimeType === 'image/png' ? '.png' : '.jpg'
  return new File([blob], `${baseName}${ext}`, { type: mimeType })
}