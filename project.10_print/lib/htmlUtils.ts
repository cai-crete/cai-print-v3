/**
 * htmlUtils.ts — Gemini 생성 HTML 파싱 유틸리티
 *
 * Gemini는 다중 페이지 문서를 단일 HTML 문자열로 반환한다.
 * (<div class="page">...</div> 구조 반복)
 * splitHtmlPages()는 이를 페이지별 독립 HTML 문서 배열로 분리한다.
 *
 * COPYRIGHTS 2026. CRE-TE CO.,LTD. ALL RIGHTS RESERVED.
 */

/**
 * 단일 HTML 문자열에서 <head> 섹션을 추출한다.
 * 없으면 빈 문자열 반환.
 */
function extractHead(html: string): string {
  const match = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  return match ? match[0] : ''
}

/**
 * Gemini 생성 HTML을 <div class="page"> 단위로 분리하여
 * 각각 완전한 HTML 문서(<!DOCTYPE html>...)로 반환한다.
 *
 * 분리 기준:
 *   - `<div class="page"` 또는 `<div class="page ` (추가 클래스 포함) 패턴
 *
 * 페이지가 발견되지 않으면 원본 html을 요소 1개짜리 배열로 반환한다.
 */
export function splitHtmlPages(html: string): string[] {
  if (!html || html.trim() === '') return []  // 유효한 HTML 없음 — 빈 배열 의도적 반환

  const head = extractHead(html)

  // <div class="page" ...> 로 시작하는 모든 블록 추출
  // 각 블록은 "다음 페이지 div 시작" 또는 "</body>" 직전까지
  const pageRegex = /<div\s[^>]*class="[^"]*\bpage\b[^"]*"[^>]*>/gi
  const matches: { index: number; tag: string }[] = []

  let m: RegExpExecArray | null
  while ((m = pageRegex.exec(html)) !== null) {
    matches.push({ index: m.index, tag: m[0] })
  }

  if (matches.length === 0) {
    // 페이지 구분자가 없으면 전체를 단일 페이지로 반환
    return [html]
  }

  const pages: string[] = []

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index
    const end   = i + 1 < matches.length ? matches[i + 1].index : html.length

    // 각 블록 내용 — 닫는 </div> 포함 추출
    const pageBlock = extractBalancedDiv(html, start)

    const pageHtml = `<!DOCTYPE html>
<html>
${head}
<body style="margin:0;padding:0;background:white;">
${pageBlock}
</body>
</html>`

    pages.push(pageHtml)
  }

  return pages
}

/**
 * HTML 문자열의 특정 위치에서 시작하는 <div>의 균형 잡힌 닫기 태그까지 추출한다.
 * 중첩 div를 올바르게 처리한다.
 */
function extractBalancedDiv(html: string, startIndex: number): string {
  let depth = 0
  let i = startIndex

  while (i < html.length) {
    // 여는 태그 탐색
    if (html[i] === '<') {
      if (html.slice(i, i + 4).toLowerCase() === '<div') {
        // <div 태그인지 확인 (다른 태그 제외)
        const nextChar = html[i + 4]
        if (nextChar === ' ' || nextChar === '>' || nextChar === '\n' || nextChar === '\t') {
          depth++
          // 태그 끝까지 이동
          const tagEnd = html.indexOf('>', i)
          if (tagEnd === -1) break
          // self-closing 여부 확인
          if (html[tagEnd - 1] === '/') {
            depth--
          }
          i = tagEnd + 1
          continue
        }
      } else if (html.slice(i, i + 6).toLowerCase() === '</div>') {
        depth--
        if (depth === 0) {
          return html.slice(startIndex, i + 6)
        }
        i += 6
        continue
      }
    }
    i++
  }

  // 닫기 태그를 못 찾은 경우 startIndex부터 끝까지 반환
  return html.slice(startIndex)
}
